package com.paf.smarthub.facility;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for FacilityEntity persistence operations.
 * Provides search and filter query methods for the catalogue.
 */
@Repository
public interface FacilityRepository extends JpaRepository<FacilityEntity, Long> {

    List<FacilityEntity> findByFacilityType(FacilityEnums.FacilityType facilityType);

    List<FacilityEntity> findByStatus(FacilityEnums.FacilityStatus status);

    List<FacilityEntity> findByFacilityTypeAndStatus(
            FacilityEnums.FacilityType facilityType,
            FacilityEnums.FacilityStatus status);

    List<FacilityEntity> findByCapacityGreaterThanEqual(Integer capacity);

    List<FacilityEntity> findByLocationContainingIgnoreCase(String location);

    boolean existsByNameIgnoreCase(String name);

        Optional<FacilityEntity> findByName(String name);
    Optional<FacilityEntity> findByNameIgnoreCase(String name);

    /**
     * Combined search/filter query supporting keyword search (name or location),
     * type filter, status filter, minimum capacity, and location filter.
     * All parameters are optional (null = ignore).
     */
    @Query("SELECT f FROM FacilityEntity f WHERE " +
            "(:keyword IS NULL OR LOWER(f.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "   OR LOWER(f.location) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:type IS NULL OR f.facilityType = :type) " +
            "AND (:status IS NULL OR f.status = :status) " +
            "AND (:minCapacity IS NULL OR f.capacity >= :minCapacity) " +
            "AND (:location IS NULL OR LOWER(f.location) LIKE LOWER(CONCAT('%', :location, '%')))")
    List<FacilityEntity> searchFacilities(
            @Param("keyword") String keyword,
            @Param("type") FacilityEnums.FacilityType type,
            @Param("status") FacilityEnums.FacilityStatus status,
            @Param("minCapacity") Integer minCapacity,
            @Param("location") String location);
}



