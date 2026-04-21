package com.paf.smarthub.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Repository for Booking entity.
 * Provides CRUD operations and custom queries for bookings.
 */
@Repository
public interface BookingRepository extends JpaRepository<BookingEntity, Long> {

    /**
     * Find all bookings for a facility that conflict with a given time slot
     * Conflict means: same date and overlapping time with PENDING or APPROVED status
     */
    @Query("""
        SELECT b.id, b.startTime, b.endTime 
        FROM BookingEntity b 
        WHERE b.facility.id = :facilityId 
        AND b.bookingDate = :bookingDate
        AND b.status IN ('APPROVED', 'PENDING')
        AND (b.startTime < :endTime AND b.endTime > :startTime)
    """)
    List<Object[]> findConflictingBookings(
        @Param("facilityId") Long facilityId,
        @Param("bookingDate") LocalDate bookingDate,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );

    /**
     * Count active bookings for a facility (excluding cancelled and completed)
     */
    @Query("""
        SELECT COUNT(b) 
        FROM BookingEntity b 
        WHERE b.facility.id = :facilityId 
        AND b.status != :excludeStatus
    """)
    long countByFacilityIdAndStatusNot(
        @Param("facilityId") Long facilityId,
        @Param("excludeStatus") String excludeStatus
    );
}
