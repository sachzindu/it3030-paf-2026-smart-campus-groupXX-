package com.paf.smarthub.facility;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Data transfer objects for the Facility module.
 * Groups related DTOs as static inner classes for cohesion.
 */
public class FacilityDTO {

    /**
     * Response DTO returned to the client.
     * Maps all entity fields for read operations.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FacilityResponse {
        private Long id;
        private String name;
        private String description;
        private FacilityEnums.FacilityType facilityType;
        private FacilityEnums.AssetType assetType;
        private Integer capacity;
        private String location;
        private FacilityEnums.FacilityStatus status;
        private LocalTime availableFrom;
        private LocalTime availableTo;
        private String imageUrl;
        private Integer healthScore;
        private List<String> improvementSuggestions;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    /**
     * Request DTO for creating a new facility.
     * All required fields are validated with Jakarta Validation annotations.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateFacilityRequest {

        @NotBlank(message = "Facility name is required")
        @Size(max = 150, message = "Facility name must be at most 150 characters")
        private String name;

        @Size(max = 2000, message = "Description must be at most 2000 characters")
        private String description;

        @NotNull(message = "Facility type is required")
        private FacilityEnums.FacilityType facilityType;

        /**
         * Required only when facilityType is EQUIPMENT.
         */
        private FacilityEnums.AssetType assetType;

        @Min(value = 1, message = "Capacity must be at least 1")
        private Integer capacity;

        @NotBlank(message = "Location is required")
        @Size(max = 255, message = "Location must be at most 255 characters")
        private String location;

        private FacilityEnums.FacilityStatus status;

        private LocalTime availableFrom;
        private LocalTime availableTo;

        private String imageUrl;
    }

    /**
     * Request DTO for updating an existing facility.
     * All fields are optional — only non-null fields are applied.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateFacilityRequest {

        @Size(max = 150, message = "Facility name must be at most 150 characters")
        private String name;

        @Size(max = 2000, message = "Description must be at most 2000 characters")
        private String description;

        private FacilityEnums.FacilityType facilityType;
        private FacilityEnums.AssetType assetType;

        @Min(value = 1, message = "Capacity must be at least 1")
        private Integer capacity;

        @Size(max = 255, message = "Location must be at most 255 characters")
        private String location;

        private FacilityEnums.FacilityStatus status;

        private LocalTime availableFrom;
        private LocalTime availableTo;

        private String imageUrl;
    }

    /**
     * Request DTO for checking facility availability.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailabilityRequest {

        @NotNull(message = "Booking date is required")
        private String bookingDate;

        @NotNull(message = "Start time is required")
        private String startTime;

        @NotNull(message = "End time is required")
        private String endTime;
    }

    /**
     * Response DTO for availability check results.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailabilityResponse {
        private Boolean available;
        private String message;
        private LocalTime facilityOpenFrom;
        private LocalTime facilityOpenUntil;
        private String requestedTimeSlot;
    }

    /**
     * Response DTO for facility image uploads.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageUploadResponse {
        private String imageUrl;
        private String fileName;
    }
}
