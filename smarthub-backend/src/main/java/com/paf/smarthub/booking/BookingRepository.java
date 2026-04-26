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
    List<BookingEntity> findByUserId(Long userId);

    List<BookingEntity> findByStatus(BookingEnums.BookingStatus status);

    List<BookingEntity> findByFacilityId(Long facilityId);

    List<BookingEntity> findByUserIdAndStatus(Long userId, BookingEnums.BookingStatus status);

    List<BookingEntity> findByBookingDateBetween(LocalDate from, LocalDate to);

    /**
     * Find bookings that conflict with the requested time range.
     *
     * Two time ranges overlap when: existingStart < requestedEnd AND existingEnd > requestedStart
     *
     * Only considers PENDING and APPROVED bookings (not REJECTED or CANCELLED).
     * Optionally excludes a specific booking (for re-checking on approval).
     *
     * @param facilityId the facility to check
     * @param bookingDate the date to check
     * @param startTime the requested start time
     * @param endTime the requested end time
     * @param excludeBookingId booking ID to exclude (null to include all)
     * @return list of conflicting bookings
     */
    @Query("SELECT b FROM BookingEntity b WHERE " +
            "b.facility.id = :facilityId " +
            "AND b.bookingDate = :bookingDate " +
            "AND b.startTime < :endTime " +
            "AND b.endTime > :startTime " +
            "AND b.status IN (com.paf.smarthub.booking.BookingEnums.BookingStatus.PENDING, " +
            "                  com.paf.smarthub.booking.BookingEnums.BookingStatus.APPROVED) " +
            "AND (:excludeBookingId IS NULL OR b.id <> :excludeBookingId)")
    List<BookingEntity> findConflictingBookings(
            @Param("facilityId") Long facilityId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeBookingId") Long excludeBookingId);

    /**
     * Find all bookings for a specific facility with a given status.
     */
    List<BookingEntity> findByFacilityIdAndStatus(Long facilityId, BookingEnums.BookingStatus status);

    /**
     * Check if a facility has any active (pending or approved) bookings.
     * Used to prevent deletion of facilities with outstanding bookings.
     */
    @Query("SELECT COUNT(b) > 0 FROM BookingEntity b WHERE " +
            "b.facility.id = :facilityId " +
            "AND b.status IN (com.paf.smarthub.booking.BookingEnums.BookingStatus.PENDING, " +
            "                  com.paf.smarthub.booking.BookingEnums.BookingStatus.APPROVED)")
    boolean hasActiveBookings(@Param("facilityId") Long facilityId);
}
