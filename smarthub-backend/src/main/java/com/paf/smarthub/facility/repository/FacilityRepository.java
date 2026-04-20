package com.paf.smarthub.facility.repository;

import com.paf.smarthub.facility.entity.FacilityEntity;
import com.paf.smarthub.facility.enums.FacilityStatus;
import com.paf.smarthub.facility.enums.FacilityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Facility entity.
 * Provides CRUD operations and custom queries for facilities.
 */
@Repository
public interface FacilityRepository extends JpaRepository<FacilityEntity, Long>,
        JpaSpecificationExecutor<FacilityEntity> {

    // Find by type
    Page<FacilityEntity> findByType(FacilityType type, Pageable pageable);

    // Find by status
    Page<FacilityEntity> findByStatus(FacilityStatus status, Pageable pageable);

    // Find by type and status
    Page<FacilityEntity> findByTypeAndStatus(FacilityType type, FacilityStatus status, Pageable pageable);

    // Find all by status (without pagination)
    List<FacilityEntity> findByStatus(FacilityStatus status);

    // Check if facility exists by name
    boolean existsByName(String name);

    // Find by location
    List<FacilityEntity> findByLocationContainingIgnoreCase(String location);
}
