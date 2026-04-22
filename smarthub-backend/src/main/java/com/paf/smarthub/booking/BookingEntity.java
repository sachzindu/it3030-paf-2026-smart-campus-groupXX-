package com.paf.smarthub.booking;

import com.paf.smarthub.auth.entity.User;
import com.paf.smarthub.shared.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Represents a booking request for a campus facility or asset.
 *
 * Lifecycle: PENDING → APPROVED/REJECTED (by admin).
 * PENDING and APPROVED bookings can be CANCELLED by the requester.
 */
@Entity
@Table(name = "bookings", indexes = {
        @Index(name = "idx_booking_facility", columnList = "facility_id"),
        @Index(name = "idx_booking_user", columnList = "user_id"),
        @Index(name = "idx_booking_status", columnList = "status"),
        @Index(name = "idx_booking_date", columnList = "booking_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The facility/asset being booked.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false)
    private FacilityEntity facility;

    /**
     * The user who requested the booking.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    /**
     * Purpose/reason for the booking.
     */
    @Column(nullable = false, length = 500)
    private String purpose;

    /**
     * Expected number of attendees (relevant for room bookings).
     */
    @Column(name = "expected_attendees")
    private Integer expectedAttendees;

    /**
     * Current status of the booking in the workflow.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BookingEnums.BookingStatus status = BookingEnums.BookingStatus.PENDING;

    /**
     * Admin remarks — reason for approval/rejection.
     */
    @Column(name = "admin_remarks", length = 500)
    private String adminRemarks;

    /**
     * The admin who reviewed (approved/rejected) the booking.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    /**
     * Timestamp when the booking was reviewed.
     */
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}
