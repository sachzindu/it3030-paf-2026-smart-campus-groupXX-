package com.paf.smarthub.facility.mapper;

import com.paf.smarthub.facility.dto.CreateFacilityRequest;
import com.paf.smarthub.facility.dto.FacilityDTO;
import com.paf.smarthub.facility.dto.UpdateFacilityRequest;
import com.paf.smarthub.facility.entity.FacilityEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting between FacilityEntity and DTOs.
 * Handles conversions for API requests and responses.
 */
@Component
public class FacilityMapper {

    /**
     * Convert FacilityEntity to FacilityDTO
     */
    public FacilityDTO toDTO(FacilityEntity entity) {
        if (entity == null) {
            return null;
        }

        FacilityDTO dto = new FacilityDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setType(entity.getType());
        dto.setLocation(entity.getLocation());
        dto.setCapacity(entity.getCapacity());
        dto.setStatus(entity.getStatus());
        dto.setAmenities(entity.getAmenities());
        dto.setImageUrl(entity.getImageUrl());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        return dto;
    }

    /**
     * Convert CreateFacilityRequest to FacilityEntity
     */
    public FacilityEntity toEntity(CreateFacilityRequest request) {
        if (request == null) {
            return null;
        }

        FacilityEntity entity = new FacilityEntity();
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setType(request.getType());
        entity.setLocation(request.getLocation());
        entity.setCapacity(request.getCapacity());
        entity.setAmenities(request.getAmenities());
        entity.setImageUrl(request.getImageUrl());

        return entity;
    }

    /**
     * Update FacilityEntity from UpdateFacilityRequest
     * Only updates non-null fields
     */
    public void updateEntityFromRequest(UpdateFacilityRequest request, FacilityEntity entity) {
        if (request == null || entity == null) {
            return;
        }

        if (request.getName() != null) {
            entity.setName(request.getName());
        }
        if (request.getDescription() != null) {
            entity.setDescription(request.getDescription());
        }
        if (request.getType() != null) {
            entity.setType(request.getType());
        }
        if (request.getLocation() != null) {
            entity.setLocation(request.getLocation());
        }
        if (request.getCapacity() != null) {
            entity.setCapacity(request.getCapacity());
        }
        if (request.getAmenities() != null) {
            entity.setAmenities(request.getAmenities());
        }
        if (request.getImageUrl() != null) {
            entity.setImageUrl(request.getImageUrl());
        }
    }
}
