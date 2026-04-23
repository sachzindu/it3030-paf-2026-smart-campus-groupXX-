package com.paf.smarthub.facility;

import com.paf.smarthub.shared.exception.DuplicateResourceException;
import com.paf.smarthub.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.stream.Collectors;

/**
 * Service layer for Facilities & Assets Catalogue operations.
 * Handles CRUD, search/filtering, and business rule validation.
 */
@Service
@Transactional
public class FacilityService {

    private static final Logger log = LoggerFactory.getLogger(FacilityService.class);
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            "image/jpg",
            MediaType.IMAGE_GIF_VALUE,
            "image/webp");

    private final FacilityRepository facilityRepository;
    private final String fileUploadDir;

    public FacilityService(
            FacilityRepository facilityRepository,
            @Value("${file.upload-dir}") String fileUploadDir) {
        this.facilityRepository = facilityRepository;
        this.fileUploadDir = fileUploadDir;
    }

    // ==================== Create ====================

    /**
     * Create a new facility/asset resource.
     * Validates: duplicate name, equipment must have assetType,
     * availability window consistency.
     *
     * @param request the creation request data
     * @return the created facility response
     */
    public FacilityDTO.FacilityResponse createFacility(FacilityDTO.CreateFacilityRequest request) {
        // Check for duplicate name
        if (facilityRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new DuplicateResourceException("Facility", "name", request.getName());
        }

        // Validate equipment must have an asset type
        if (request.getFacilityType() == FacilityEnums.FacilityType.EQUIPMENT
                && request.getAssetType() == null) {
            throw new IllegalArgumentException(
                    "Asset type is required for equipment-type facilities.");
        }

        // Validate availability window consistency
        validateAvailabilityWindow(request.getAvailableFrom(), request.getAvailableTo());

        FacilityEntity entity = FacilityEntity.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .facilityType(request.getFacilityType())
                .assetType(request.getAssetType())
                .capacity(request.getCapacity())
                .location(request.getLocation().trim())
                .status(request.getStatus() != null
                        ? request.getStatus()
                        : FacilityEnums.FacilityStatus.ACTIVE)
                .availableFrom(request.getAvailableFrom())
                .availableTo(request.getAvailableTo())
                .imageUrl(request.getImageUrl())
                .build();

        FacilityEntity saved = facilityRepository.save(entity);
        log.info("Facility created: {} (type: {})", saved.getName(), saved.getFacilityType());

        return mapToResponse(saved);
    }

    // ==================== Read ====================

    /**
     * Get a facility by its ID.
     *
     * @param id the facility ID
     * @return the facility response
     */
    @Transactional(readOnly = true)
    public FacilityDTO.FacilityResponse getFacilityById(Long id) {
        FacilityEntity entity = findEntityById(id);
        return mapToResponse(entity);
    }

    /**
     * Get all facilities in the catalogue.
     *
     * @return list of all facility responses
     */
    @Transactional(readOnly = true)
    public List<FacilityDTO.FacilityResponse> getAllFacilities() {
        return facilityRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all facilities with optional filtering by type and status.
     *
     * @param type   filter by facility type (optional, null = all types)
     * @param status filter by facility status (optional, null = all statuses)
     * @return list of matching facility responses
     */
    @Transactional(readOnly = true)
    public List<FacilityDTO.FacilityResponse> getAllFacilitiesFiltered(
            FacilityEnums.FacilityType type,
            FacilityEnums.FacilityStatus status) {
        
        // If no filters are provided, return all facilities
        if (type == null && status == null) {
            return getAllFacilities();
        }
        
        // If only type filter is provided
        if (type != null && status == null) {
            return facilityRepository.findByFacilityType(type)
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
        
        // If only status filter is provided
        if (type == null && status != null) {
            return facilityRepository.findByStatus(status)
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
        
        // If both filters are provided
        return facilityRepository.findByFacilityTypeAndStatus(type, status)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search/filter facilities by keyword, type, status, capacity, and location.
     * All parameters are optional.
     *
     * @param keyword     search keyword (matches name or location)
     * @param type        filter by facility type
     * @param status      filter by status
     * @param minCapacity filter by minimum capacity
     * @param location    filter by location substring
     * @return list of matching facility responses
     */
    @Transactional(readOnly = true)
    public List<FacilityDTO.FacilityResponse> searchFacilities(
            String keyword,
            FacilityEnums.FacilityType type,
            FacilityEnums.FacilityStatus status,
            Integer minCapacity,
            String location) {

        return facilityRepository.searchFacilities(keyword, type, status, minCapacity, location)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ==================== Update ====================

    /**
     * Update an existing facility. Only non-null fields in the request are applied.
     * Validates: duplicate name on rename, availability window consistency.
     *
     * @param id      the facility ID
     * @param request the update request with optional fields
     * @return the updated facility response
     */
    public FacilityDTO.FacilityResponse updateFacility(
            Long id, FacilityDTO.UpdateFacilityRequest request) {

        FacilityEntity entity = findEntityById(id);

        // Check for duplicate name on rename
        if (request.getName() != null
                && !request.getName().trim().equalsIgnoreCase(entity.getName())
                && facilityRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new DuplicateResourceException("Facility", "name", request.getName());
        }

        applyUpdates(entity, request);

        // Validate equipment consistency after update
        if (entity.getFacilityType() == FacilityEnums.FacilityType.EQUIPMENT
                && entity.getAssetType() == null) {
            throw new IllegalArgumentException(
                    "Asset type is required for equipment-type facilities.");
        }

        // Validate availability window after update
        validateAvailabilityWindow(entity.getAvailableFrom(), entity.getAvailableTo());

        FacilityEntity saved = facilityRepository.save(entity);
        log.info("Facility updated: {} (id: {})", saved.getName(), saved.getId());

        return mapToResponse(saved);
    }

    // ==================== Delete ====================

    /**
     * Delete a facility by its ID.
     *
     * @param id the facility ID
     */
    public void deleteFacility(Long id) {
        FacilityEntity entity = findEntityById(id);
        facilityRepository.delete(entity);
        log.info("Facility deleted: {} (id: {})", entity.getName(), entity.getId());
    }

    // ==================== Availability Check ====================

    /**
     * Check if a facility is available during a requested time slot.
     *
     * @param id the facility ID
     * @param request the availability request with bookingDate, startTime, endTime
     * @return availability response with status and message
     */
    @Transactional(readOnly = true)
    public FacilityDTO.AvailabilityResponse checkAvailability(
            Long id, FacilityDTO.AvailabilityRequest request) {

        FacilityEntity facility = findEntityById(id);

        // Check if facility is active
        if (facility.getStatus() != FacilityEnums.FacilityStatus.ACTIVE) {
            return FacilityDTO.AvailabilityResponse.builder()
                    .available(false)
                    .message("Facility is not currently active")
                    .facilityOpenFrom(facility.getAvailableFrom())
                    .facilityOpenUntil(facility.getAvailableTo())
                    .requestedTimeSlot(request.getStartTime() + " - " + request.getEndTime())
                    .build();
        }

        // Parse requested times
        java.time.LocalTime requestedStart = java.time.LocalTime.parse(request.getStartTime());
        java.time.LocalTime requestedEnd = java.time.LocalTime.parse(request.getEndTime());

        // Check if facility has availability window set
        if (facility.getAvailableFrom() == null || facility.getAvailableTo() == null) {
            return FacilityDTO.AvailabilityResponse.builder()
                    .available(true)
                    .message("Facility is available (no time restrictions)")
                    .facilityOpenFrom(null)
                    .facilityOpenUntil(null)
                    .requestedTimeSlot(request.getStartTime() + " - " + request.getEndTime())
                    .build();
        }

        // Check if requested time slot is within facility's available window
        boolean isAvailable = (requestedStart.isAfter(facility.getAvailableFrom()) ||
                requestedStart.equals(facility.getAvailableFrom())) &&
                (requestedEnd.isBefore(facility.getAvailableTo()) ||
                        requestedEnd.equals(facility.getAvailableTo()));

        String message = isAvailable
                ? "Facility is available for the requested time slot"
                : String.format("Facility is only available from %s to %s",
                facility.getAvailableFrom(), facility.getAvailableTo());

        return FacilityDTO.AvailabilityResponse.builder()
                .available(isAvailable)
                .message(message)
                .facilityOpenFrom(facility.getAvailableFrom())
                .facilityOpenUntil(facility.getAvailableTo())
                .requestedTimeSlot(request.getStartTime() + " - " + request.getEndTime())
                .build();
    }

    /**
     * Upload a facility image and return its public URL.
     */
    public FacilityDTO.ImageUploadResponse uploadFacilityImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select an image file to upload.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Only JPG, PNG, GIF, and WEBP images are allowed.");
        }

        String originalFileName = file.getOriginalFilename();
        String extension = getFileExtension(originalFileName);
        String generatedFileName = UUID.randomUUID() + extension;

        Path uploadPath = Paths.get(fileUploadDir, "facilities").toAbsolutePath().normalize();
        Path targetPath = uploadPath.resolve(generatedFileName);

        try {
            Files.createDirectories(uploadPath);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            log.error("Failed to store facility image {}", originalFileName, ex);
            throw new RuntimeException("Failed to upload facility image.", ex);
        }

        String imageUrl = "/uploads/facilities/" + generatedFileName;
        return FacilityDTO.ImageUploadResponse.builder()
                .imageUrl(imageUrl)
                .fileName(generatedFileName)
                .build();
    }

    // ==================== Helper Methods ====================

    /**
     * Find entity by ID or throw ResourceNotFoundException.
     * Public visibility so that BookingService can validate facility existence.
     */
    public FacilityEntity findEntityById(Long id) {
        return facilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility", "id", id));
    }

    /**
     * Validate that availableFrom is before availableTo when both are provided.
     */
    private void validateAvailabilityWindow(java.time.LocalTime from, java.time.LocalTime to) {
        if (from != null && to != null && !from.isBefore(to)) {
            throw new IllegalArgumentException(
                    "Availability window 'availableFrom' must be before 'availableTo'.");
        }
    }

    /**
     * Apply non-null fields from the update request to the entity.
     */
    private void applyUpdates(FacilityEntity entity, FacilityDTO.UpdateFacilityRequest request) {
        if (request.getName() != null) {
            entity.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            entity.setDescription(request.getDescription());
        }
        if (request.getFacilityType() != null) {
            entity.setFacilityType(request.getFacilityType());
        }
        if (request.getAssetType() != null) {
            entity.setAssetType(request.getAssetType());
        }
        if (request.getCapacity() != null) {
            entity.setCapacity(request.getCapacity());
        }
        if (request.getLocation() != null) {
            entity.setLocation(request.getLocation().trim());
        }
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }
        if (request.getAvailableFrom() != null) {
            entity.setAvailableFrom(request.getAvailableFrom());
        }
        if (request.getAvailableTo() != null) {
            entity.setAvailableTo(request.getAvailableTo());
        }
        if (request.getImageUrl() != null) {
            entity.setImageUrl(request.getImageUrl());
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return ".png";
        }
        return fileName.substring(fileName.lastIndexOf('.'));
    }

    /**
     * Map a FacilityEntity to a FacilityResponse DTO.
     */
    private FacilityDTO.FacilityResponse mapToResponse(FacilityEntity entity) {
        return FacilityDTO.FacilityResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .facilityType(entity.getFacilityType())
                .assetType(entity.getAssetType())
                .capacity(entity.getCapacity())
                .location(entity.getLocation())
                .status(entity.getStatus())
                .availableFrom(entity.getAvailableFrom())
                .availableTo(entity.getAvailableTo())
                .imageUrl(entity.getImageUrl())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
