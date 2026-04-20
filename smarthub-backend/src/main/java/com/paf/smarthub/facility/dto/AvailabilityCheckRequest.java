package com.paf.smarthub.facility.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Request DTO for checking facility availability.
 * Used in POST /api/facilities/{id}/check-availability endpoint.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityCheckRequest {

    @NotNull(message = "Booking date is required")
    private LocalDate bookingDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;
}
