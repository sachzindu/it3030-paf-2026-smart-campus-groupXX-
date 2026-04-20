package com.paf.smarthub.facility.dto;

import com.paf.smarthub.facility.enums.FacilityStatus;
import com.paf.smarthub.facility.enums.FacilityType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Data Transfer Object for Facility.
 * Used for API responses to send facility data to clients.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacilityDTO {
    private Long id;
    private String name;
    private String description;
    private FacilityType type;
    private String location;
    private Integer capacity;
    private FacilityStatus status;
    private List<String> amenities;
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
