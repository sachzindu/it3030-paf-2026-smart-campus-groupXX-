package com.paf.smarthub.facility.service;

import com.paf.smarthub.facility.dto.*;
import com.paf.smarthub.facility.entity.FacilityEntity;
import com.paf.smarthub.facility.enums.FacilityStatus;
import com.paf.smarthub.facility.enums.FacilityType;
import com.paf.smarthub.facility.mapper.FacilityMapper;
import com.paf.smarthub.facility.repository.FacilityRepository;
import com.paf.smarthub.shared.exception.ResourceNotFoundException;
import com.paf.smarthub.shared.exception.ValidationException;
import com.paf.smarthub.booking.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for Facility management.
 * Handles business logic for facility operations including CRUD, search, and availability checking.
 */
@Service
@RequiredArgsConstructor
public class FacilityService {

    private final FacilityRepository facilityRepository;
    private final BookingRepository bookingRepository;
    private final FacilityMapper facilityMapper;

    /**
     * Get all facilities with pagination and optional filters
     */
    public Page<FacilityDTO> getAllFacilities(int page, int size,
                                               FacilityType type, FacilityStatus status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<FacilityEntity> facilities;
        if (type != null && status != null) {
            facilities = facilityRepository.findByTypeAndStatus(type, status, pageable);
        } else if (type != null) {
            facilities = facilityRepository.findByType(type, pageable);
        } else if (status != null) {
            facilities = facilityRepository.findByStatus(status, pageable);
        } else {
            facilities = facilityRepository.findAll(pageable);
        }

        return facilities.map(facilityMapper::toDTO);
    }

    /**
     * Get facility by ID
     */
    public FacilityDTO getFacilityById(Long id) {
        FacilityEntity facility = facilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + id));
        return facilityMapper.toDTO(facility);
    }

    /**
     * Search facilities with complex criteria using Specifications
     */
    public List<FacilityDTO> searchFacilities(FacilitySearchRequest request) {
        Specification<FacilityEntity> spec = (root, query, cb) -> cb.conjunction();

        // Name filter (case-insensitive)
        if (request.getName() != null && !request.getName().isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("name")), "%" + request.getName().toLowerCase() + "%"));
        }

        // Type filter
        if (request.getType() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("type"), request.getType()));
        }

        // Minimum capacity filter
        if (request.getMinCapacity() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("capacity"), request.getMinCapacity()));
        }

        // Maximum capacity filter
        if (request.getMaxCapacity() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("capacity"), request.getMaxCapacity()));
        }

        // Location filter (case-insensitive)
        if (request.getLocation() != null && !request.getLocation().isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("location")), "%" + request.getLocation().toLowerCase() + "%"));
        }

        // Status filter
        if (request.getStatus() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), request.getStatus()));
        }

        return facilityRepository.findAll(spec).stream()
                .map(facilityMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Check availability of a facility for a specific time slot
     */
    public AvailabilityCheckResponse checkAvailability(Long facilityId,
                                                      AvailabilityCheckRequest request) {
        FacilityEntity facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found"));

        // Check if facility is active
        if (!facility.getStatus().equals(FacilityStatus.ACTIVE)) {
            return new AvailabilityCheckResponse(
                    false,
                    Collections.emptyList(),
                    "Facility is not available (Status: " + facility.getStatus().getDisplayName() + ")"
            );
        }

        // Check for conflicting bookings
        List<Object[]> conflicts = bookingRepository.findConflictingBookings(
                facilityId,
                request.getBookingDate(),
                request.getStartTime(),
                request.getEndTime()
        );

        if (conflicts.isEmpty()) {
            return new AvailabilityCheckResponse(
                    true,
                    new ArrayList<>(),
                    "Facility is available for the requested time slot"
            );
        }

        // Convert conflicts to DTO format
        List<AvailabilityCheckResponse.ConflictingBooking> conflictDetails = conflicts.stream()
                .map(conflict -> new AvailabilityCheckResponse.ConflictingBooking(
                        (Long) conflict[0],
                        (java.time.LocalTime) conflict[1],
                        (java.time.LocalTime) conflict[2]
                ))
                .collect(Collectors.toList());

        return new AvailabilityCheckResponse(
                false,
                conflictDetails,
                "Facility has " + conflicts.size() + " booking conflict(s) during this time"
        );
    }

    /**
     * Get all facilities that are currently available (status = ACTIVE)
     */
    public List<FacilityDTO> getAvailableFacilitiesNow() {
        List<FacilityEntity> availableFacilities = facilityRepository.findByStatus(FacilityStatus.ACTIVE);
        return availableFacilities.stream()
                .map(facilityMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Create a new facility (Admin only)
     */
    @Transactional
    public FacilityDTO createFacility(CreateFacilityRequest request) {
        // Validate input
        if (request.getCapacity() == null || request.getCapacity() <= 0) {
            throw new ValidationException("Capacity must be greater than 0");
        }

        // Check if facility name already exists
        if (facilityRepository.existsByName(request.getName())) {
            throw new ValidationException("Facility with name '" + request.getName() + "' already exists");
        }

        FacilityEntity facility = facilityMapper.toEntity(request);
        facility.setStatus(FacilityStatus.ACTIVE);
        facility.setCreatedAt(LocalDateTime.now());

        FacilityEntity saved = facilityRepository.save(facility);
        return facilityMapper.toDTO(saved);
    }

    /**
     * Update an existing facility (Admin only)
     */
    @Transactional
    public FacilityDTO updateFacility(Long id, UpdateFacilityRequest request) {
        FacilityEntity facility = facilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + id));

        // Check if new name already exists (excluding current facility)
        if (request.getName() != null && !request.getName().equals(facility.getName())) {
            if (facilityRepository.existsByName(request.getName())) {
                throw new ValidationException("Facility with name '" + request.getName() + "' already exists");
            }
        }

        // Validate capacity if provided
        if (request.getCapacity() != null && request.getCapacity() <= 0) {
            throw new ValidationException("Capacity must be greater than 0");
        }

        facilityMapper.updateEntityFromRequest(request, facility);
        facility.setUpdatedAt(LocalDateTime.now());

        FacilityEntity updated = facilityRepository.save(facility);
        return facilityMapper.toDTO(updated);
    }

    /**
     * Update facility status (Admin only)
     */
    @Transactional
    public FacilityDTO updateFacilityStatus(Long id, FacilityStatus newStatus) {
        FacilityEntity facility = facilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + id));

        facility.setStatus(newStatus);
        facility.setUpdatedAt(LocalDateTime.now());

        FacilityEntity updated = facilityRepository.save(facility);
        return facilityMapper.toDTO(updated);
    }

    /**
     * Delete a facility (Admin only)
     * Cannot delete facility with active bookings
     */
    @Transactional
    public void deleteFacility(Long id) {
        FacilityEntity facility = facilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + id));

        // Check if facility has active bookings
        long activeBookings = bookingRepository.countByFacilityIdAndStatusNot(id, "CANCELLED");

        if (activeBookings > 0) {
            throw new ValidationException(
                    "Cannot delete facility with " + activeBookings + " active booking(s). " +
                    "Cancel or complete all bookings first."
            );
        }

        facilityRepository.deleteById(id);
    }
}
