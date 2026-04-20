package com.paf.smarthub.facility;

import com.paf.smarthub.facility.dto.AvailabilityCheckRequest;
import com.paf.smarthub.facility.dto.AvailabilityCheckResponse;
import com.paf.smarthub.facility.dto.CreateFacilityRequest;
import com.paf.smarthub.facility.dto.FacilityDTO;
import com.paf.smarthub.facility.dto.FacilitySearchRequest;
import com.paf.smarthub.facility.dto.UpdateFacilityRequest;
import com.paf.smarthub.facility.enums.FacilityStatus;
import com.paf.smarthub.facility.enums.FacilityType;
import com.paf.smarthub.facility.service.FacilityService;
import com.paf.smarthub.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Facility management.
 * Provides endpoints for viewing, searching, creating, updating, and deleting facilities.
 *
 * Public Endpoints:
 *   GET /api/facilities - List all facilities with pagination and filters
 *   GET /api/facilities/{id} - Get facility details
 *   POST /api/facilities/search - Advanced search for facilities
 *   POST /api/facilities/{id}/check-availability - Check booking availability
 *   GET /api/facilities/{id}/availability - Get availability calendar
 *   GET /api/facilities/available/now - Get currently available facilities
 *
 * Admin Only Endpoints:
 *   POST /api/facilities - Create new facility
 *   PUT /api/facilities/{id} - Update facility
 *   PATCH /api/facilities/{id}/status - Change facility status
 *   DELETE /api/facilities/{id} - Delete facility
 */
@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService facilityService;

    /**
     * 1. GET all facilities with pagination and optional filters
     * Public endpoint
     *
     * @param page Page number (0-indexed)
     * @param size Number of results per page
     * @param type Filter by facility type (optional)
     * @param status Filter by facility status (optional)
     * @return Page of FacilityDTOs
     */
    @GetMapping
    public ResponseEntity<Page<FacilityDTO>> getAllFacilities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) FacilityType type,
            @RequestParam(required = false) FacilityStatus status
    ) {
        Page<FacilityDTO> facilities = facilityService.getAllFacilities(page, size, type, status);
        return ResponseEntity.ok(facilities);
    }

    /**
     * 2. GET facility by ID
     * Public endpoint
     *
     * @param id Facility ID
     * @return FacilityDTO
     */
    @GetMapping("/{id}")
    public ResponseEntity<FacilityDTO> getFacilityById(@PathVariable Long id) {
        FacilityDTO facility = facilityService.getFacilityById(id);
        return ResponseEntity.ok(facility);
    }

    /**
     * 3. SEARCH facilities with advanced criteria
     * Public endpoint
     *
     * @param request Search criteria
     * @return List of matching FacilityDTOs
     */
    @PostMapping("/search")
    public ResponseEntity<List<FacilityDTO>> searchFacilities(
            @Valid @RequestBody FacilitySearchRequest request
    ) {
        List<FacilityDTO> results = facilityService.searchFacilities(request);
        return ResponseEntity.ok(results);
    }

    /**
     * 4. CHECK availability for a facility during a time slot
     * Public endpoint - helps users check before booking
     *
     * @param id Facility ID
     * @param request Availability check request (date, start time, end time)
     * @return AvailabilityCheckResponse with conflicts details
     */
    @PostMapping("/{id}/check-availability")
    public ResponseEntity<AvailabilityCheckResponse> checkAvailability(
            @PathVariable Long id,
            @Valid @RequestBody AvailabilityCheckRequest request
    ) {
        AvailabilityCheckResponse response = facilityService.checkAvailability(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 5. GET availability calendar for a facility
     * Public endpoint
     *
     * @param id Facility ID
     * @return List of available time slots
     */
    @GetMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<String>> getAvailabilityCalendar(@PathVariable Long id) {
        // For now, return basic response
        // Can be extended with calendar view logic later
        return ResponseEntity.ok(ApiResponse.success(
                "Availability calendar for facility " + id
        ));
    }

    /**
     * 6. GET all currently available facilities
     * Public endpoint
     *
     * @return List of available FacilityDTOs
     */
    @GetMapping("/available/now")
    public ResponseEntity<List<FacilityDTO>> getAvailableFacilitiesNow() {
        List<FacilityDTO> facilities = facilityService.getAvailableFacilitiesNow();
        return ResponseEntity.ok(facilities);
    }

    /**
     * 7. CREATE new facility
     * Admin only endpoint
     *
     * @param request Create facility request
     * @return Created FacilityDTO
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FacilityDTO>> createFacility(
            @Valid @RequestBody CreateFacilityRequest request
    ) {
        FacilityDTO created = facilityService.createFacility(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Facility created successfully",
                        created
                ));
    }

    /**
     * 8. UPDATE facility details
     * Admin only endpoint
     *
     * @param id Facility ID
     * @param request Update facility request
     * @return Updated FacilityDTO
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FacilityDTO>> updateFacility(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFacilityRequest request
    ) {
        FacilityDTO updated = facilityService.updateFacility(id, request);
        return ResponseEntity.ok(ApiResponse.success(
                "Facility updated successfully",
                updated
        ));
    }

    /**
     * 9. PATCH facility status
     * Admin only endpoint
     * Changes facility status (ACTIVE, OUT_OF_SERVICE, MAINTENANCE)
     *
     * @param id Facility ID
     * @param status New status
     * @return Updated FacilityDTO
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FacilityDTO>> updateFacilityStatus(
            @PathVariable Long id,
            @RequestParam FacilityStatus status
    ) {
        FacilityDTO updated = facilityService.updateFacilityStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(
                "Facility status updated successfully",
                updated
        ));
    }

    /**
     * 10. DELETE facility
     * Admin only endpoint
     * Cannot delete facilities with active bookings
     *
     * @param id Facility ID
     * @return No content response
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFacility(@PathVariable Long id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.noContent()
                .build();
    }
}
