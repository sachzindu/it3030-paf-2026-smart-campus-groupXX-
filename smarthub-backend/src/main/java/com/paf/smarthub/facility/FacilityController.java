package com.paf.smarthub.facility;

import com.paf.smarthub.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Facilities & Assets Catalogue.
 *
 * Admin only:
 *   - POST   /api/facilities        — create a new facility
 *   - PUT    /api/facilities/{id}   — update a facility
 *   - DELETE /api/facilities/{id}   — delete a facility
 *
 * Authenticated (any role):
 *   - GET    /api/facilities        — list all facilities
 *   - GET    /api/facilities/{id}   — get facility by ID
 *   - GET    /api/facilities/search — search/filter facilities
 */
@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    // ==================== Admin Endpoints ====================

    /**
     * Create a new facility (ADMIN only).
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FacilityDTO.FacilityResponse>> createFacility(
            @Valid @RequestBody FacilityDTO.CreateFacilityRequest request) {
        FacilityDTO.FacilityResponse response = facilityService.createFacility(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Facility created successfully", response));
    }

    /**
     * Update an existing facility (ADMIN only).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FacilityDTO.FacilityResponse>> updateFacility(
            @PathVariable Long id,
            @Valid @RequestBody FacilityDTO.UpdateFacilityRequest request) {
        FacilityDTO.FacilityResponse response = facilityService.updateFacility(id, request);
        return ResponseEntity.ok(ApiResponse.success("Facility updated successfully", response));
    }

    /**
     * Delete a facility (ADMIN only).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteFacility(@PathVariable Long id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.ok(ApiResponse.success("Facility deleted successfully"));
    }

    // ==================== Authenticated Endpoints ====================

    /**
     * Get all facilities with optional filtering by type and status.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FacilityDTO.FacilityResponse>>> getAllFacilities(
            @RequestParam(required = false) FacilityEnums.FacilityType type,
            @RequestParam(required = false) FacilityEnums.FacilityStatus status) {
        List<FacilityDTO.FacilityResponse> facilities = 
                facilityService.getAllFacilitiesFiltered(type, status);
        return ResponseEntity.ok(
                ApiResponse.success("Facilities retrieved successfully", facilities));
    }

    /**
     * Get a specific facility by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FacilityDTO.FacilityResponse>> getFacilityById(
            @PathVariable Long id) {
        FacilityDTO.FacilityResponse response = facilityService.getFacilityById(id);
        return ResponseEntity.ok(
                ApiResponse.success("Facility retrieved successfully", response));
    }

    /**
     * Search/filter facilities by keyword, type, status, capacity, and location.
     * All query parameters are optional.
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<FacilityDTO.FacilityResponse>>> searchFacilities(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) FacilityEnums.FacilityType type,
            @RequestParam(required = false) FacilityEnums.FacilityStatus status,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location) {
        List<FacilityDTO.FacilityResponse> facilities =
                facilityService.searchFacilities(keyword, type, status, minCapacity, location);
        return ResponseEntity.ok(
                ApiResponse.success("Facilities search results", facilities));
    }

    /**
     * Check if a facility is available during a requested time slot.
     */
    @PostMapping("/{id}/check-availability")
    public ResponseEntity<ApiResponse<FacilityDTO.AvailabilityResponse>> checkAvailability(
            @PathVariable Long id,
            @Valid @RequestBody FacilityDTO.AvailabilityRequest request) {
        FacilityDTO.AvailabilityResponse response = facilityService.checkAvailability(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Availability check completed", response));
    }
}
