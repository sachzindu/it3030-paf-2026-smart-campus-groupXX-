package com.paf.smarthub.facility.dto;

import com.paf.smarthub.facility.enums.FacilityType;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for updating an existing facility.
 * Used in PUT /api/facilities/{id} endpoint.
 * All fields are optional.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFacilityRequest {

    private String name;

    private String description;

    private FacilityType type;

    private String location;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    private List<String> amenities;

    private String imageUrl;
}
