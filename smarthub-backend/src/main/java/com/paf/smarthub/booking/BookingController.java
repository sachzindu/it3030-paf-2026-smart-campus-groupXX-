package com.paf.smarthub.booking;

import com.paf.smarthub.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Booking Management.
 *
 * Authenticated (any role):
 *   - POST /api/bookings          — create a booking request
 *   - GET  /api/bookings/my       — get current user's bookings
 *   - GET  /api/bookings/{id}     — get a specific booking (owner or admin)
 *   - PUT  /api/bookings/{id}/cancel — cancel own booking
 *
 * Admin only:
 *   - GET  /api/bookings              — list all bookings (with filters)
 *   - PUT  /api/bookings/{id}/review  — approve or reject a booking
 */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // ==================== Authenticated Endpoints ====================

    /**
     * Create a new booking request (any authenticated user).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BookingDTO.BookingResponse>> createBooking(
            @Valid @RequestBody BookingDTO.CreateBookingRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        BookingDTO.BookingResponse response = bookingService.createBooking(request, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Booking request created successfully", response));
    }

    /**
     * Get the current user's bookings.
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BookingDTO.BookingResponse>>> getMyBookings(
            Authentication authentication) {
        String userEmail = authentication.getName();
        List<BookingDTO.BookingResponse> bookings = bookingService.getUserBookings(userEmail);
        return ResponseEntity.ok(
                ApiResponse.success("Your bookings retrieved successfully", bookings));
    }

    /**
     * Get a specific booking by ID.
     * Users can only view their own bookings; admins can view any.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingDTO.BookingResponse>> getBookingById(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        String userRole = extractRole(authentication);
        BookingDTO.BookingResponse response =
                bookingService.getBookingById(id, userEmail, userRole);
        return ResponseEntity.ok(
                ApiResponse.success("Booking retrieved successfully", response));
    }

    /**
     * Cancel a booking (only the owner can cancel).
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingDTO.BookingResponse>> cancelBooking(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        BookingDTO.BookingResponse response = bookingService.cancelBooking(id, userEmail);
        return ResponseEntity.ok(
                ApiResponse.success("Booking cancelled successfully", response));
    }

    // ==================== Admin Endpoints ====================

    /**
     * Get all bookings with optional status and facility filters (ADMIN only).
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<BookingDTO.BookingResponse>>> getAllBookings(
            @RequestParam(required = false) BookingEnums.BookingStatus status,
            @RequestParam(required = false) Long facilityId) {
        List<BookingDTO.BookingResponse> bookings =
                bookingService.getAllBookings(status, facilityId);
        return ResponseEntity.ok(
                ApiResponse.success("All bookings retrieved successfully", bookings));
    }

    /**
     * Approve or reject a booking (ADMIN only).
     */
    @PutMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookingDTO.BookingResponse>> reviewBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingDTO.ReviewBookingRequest request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        BookingDTO.BookingResponse response =
                bookingService.reviewBooking(id, request, adminEmail);
        return ResponseEntity.ok(
                ApiResponse.success("Booking reviewed successfully", response));
    }

    // ==================== Helper ====================

    /**
     * Extract the user's role from the authentication object.
     * Roles are stored as "ROLE_ADMIN", "ROLE_USER", etc. — strip the prefix.
     */
    private String extractRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst()
                .orElse("USER");
    }
}
