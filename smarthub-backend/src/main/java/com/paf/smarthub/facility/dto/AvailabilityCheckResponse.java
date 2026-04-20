package com.paf.smarthub.facility.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;

/**
 * Response DTO for availability check.
 * Returns whether a facility is available and details of any conflicts.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityCheckResponse {
    private Boolean isAvailable;
    private List<ConflictingBooking> conflicts;
    private String message;

    /**
     * Details of a conflicting booking
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConflictingBooking {
        private Long bookingId;
        private LocalTime startTime;
        private LocalTime endTime;
    }
}
