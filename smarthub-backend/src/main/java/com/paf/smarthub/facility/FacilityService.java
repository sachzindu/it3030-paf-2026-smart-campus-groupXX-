package com.paf.smarthub.facility;

import com.paf.smarthub.shared.exception.DuplicateResourceException;
import com.paf.smarthub.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for Facilities & Assets Catalogue operations.
 * Handles CRUD, search/filtering, and business rule validation.
 */
@Service
@Transactional
public class FacilityService {

    private static final Logger log = LoggerFactory.getLogger(FacilityService.class);

    private final FacilityRepository facilityRepository;

    public FacilityService(FacilityRepository facilityRepository) {
        this.facilityRepository = facilityRepository;
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
