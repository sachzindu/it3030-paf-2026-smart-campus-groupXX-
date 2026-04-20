package com.paf.smarthub.facility.dto;

import com.paf.smarthub.facility.enums.FacilityStatus;
import com.paf.smarthub.facility.enums.FacilityType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Request DTO for searching facilities with multiple criteria.
 * Used in POST /api/facilities/search endpoint.
 * All fields are optional - use only the ones needed.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacilitySearchRequest {

    private String name;

    private FacilityType type;

    private Integer minCapacity;

    private Integer maxCapacity;

    private String location;

    private FacilityStatus status;

    private LocalDate availableDate;

    private LocalTime startTime;

    private LocalTime endTime;
}
