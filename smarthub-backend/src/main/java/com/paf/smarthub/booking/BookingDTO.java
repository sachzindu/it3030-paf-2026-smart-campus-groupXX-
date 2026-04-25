package com.paf.smarthub.booking;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Data transfer objects for the Booking Management module.
 */
public class BookingDTO {

    /**
     * Response DTO for booking details.
     * Includes denormalized facility and user names for display convenience.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingResponse {
        private Long id;

        // Facility info (denormalized for display)
        private Long facilityId;
        private String facilityName;
        private String facilityLocation;
        private String facilityType;

        // User info (denormalized for display)
        private Long userId;
        private String userName;
        private String userEmail;

        // Booking details
        private LocalDate bookingDate;
        private LocalTime startTime;
        private LocalTime endTime;
        private String purpose;
        private Integer expectedAttendees;

        // Workflow
        private String status;
        private String adminRemarks;
        private String reviewedByName;
        private LocalDateTime reviewedAt;

        // Audit
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    /**
     * Request DTO for creating a new booking.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateBookingRequest {

        @NotNull(message = "Facility ID is required")
        private Long facilityId;

        @NotNull(message = "Booking date is required")
        @FutureOrPresent(message = "Booking date must be today or in the future")
        private LocalDate bookingDate;

        @NotNull(message = "Start time is required")
        private LocalTime startTime;

        @NotNull(message = "End time is required")
        private LocalTime endTime;

        @NotBlank(message = "Purpose is required")
        @Size(max = 500, message = "Purpose must be at most 500 characters")
        private String purpose;

        @Min(value = 1, message = "Expected attendees must be at least 1")
        private Integer expectedAttendees;
    }

    /**
     * Request DTO for admin review (approve/reject) of a booking.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewBookingRequest {

        @NotNull(message = "Status is required (APPROVED or REJECTED)")
        private BookingEnums.BookingStatus status;

        @Size(max = 500, message = "Remarks must be at most 500 characters")
        private String adminRemarks;
    }
}
