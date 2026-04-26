package com.paf.smarthub.booking;

import com.paf.smarthub.auth.entity.User;
import com.paf.smarthub.auth.repository.UserRepository;
import com.paf.smarthub.facility.FacilityEntity;
import com.paf.smarthub.facility.FacilityEnums;
import com.paf.smarthub.facility.FacilityService;
import com.paf.smarthub.shared.exception.AccessDeniedException;
import com.paf.smarthub.shared.exception.BookingConflictException;
import com.paf.smarthub.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for Booking Management.
 * Handles booking creation, review workflow (approve/reject),
 * cancellation, and scheduling conflict detection.
 */
@Service
@Transactional
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookingRepository;
    private final FacilityService facilityService;
    private final UserRepository userRepository;

    public BookingService(BookingRepository bookingRepository,
                          FacilityService facilityService,
                          UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.facilityService = facilityService;
        this.userRepository = userRepository;
    }

    // ==================== Create Booking ====================

    /**
     * Create a new booking request.
     *
     * Validations:
     * 1. Facility exists and is ACTIVE
     * 2. Start time is before end time
     * 3. Booking is not in the past
     * 4. Times fall within facility availability window (if defined)
     * 5. Expected attendees do not exceed facility capacity (if applicable)
     * 6. No scheduling conflicts with existing bookings
     *
     * @param request   the booking creation request
     * @param userEmail the email of the requesting user
     * @return the created booking response
     */
    public BookingDTO.BookingResponse createBooking(
            BookingDTO.CreateBookingRequest request, String userEmail) {

        // 1. Load and validate facility
        FacilityEntity facility = facilityService.findEntityById(request.getFacilityId());
        if (facility.getStatus() == FacilityEnums.FacilityStatus.OUT_OF_SERVICE) {
            throw new IllegalArgumentException(
                    "Cannot book facility '" + facility.getName() + "' — it is currently out of service.");
        }

        // 2. Validate time range
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        // 3. Validate booking is not in the past
        validateNotInPast(request.getBookingDate(), request.getStartTime());

        // 4. Validate against facility availability window
        validateAvailabilityWindow(facility, request.getStartTime(), request.getEndTime());

        // 5. Validate expected attendees vs capacity
        validateCapacity(facility, request.getExpectedAttendees());

        // 6. Check scheduling conflicts
        checkForConflicts(request.getFacilityId(), request.getBookingDate(),
                request.getStartTime(), request.getEndTime(), null);

        // Load user
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        // Create booking
        BookingEntity booking = BookingEntity.builder()
                .facility(facility)
                .user(user)
                .bookingDate(request.getBookingDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose().trim())
                .expectedAttendees(request.getExpectedAttendees())
                .status(BookingEnums.BookingStatus.PENDING)
                .build();

        BookingEntity saved = bookingRepository.save(booking);
        log.info("Booking created: id={} facility='{}' by={} date={} {}-{}",
                saved.getId(), facility.getName(), userEmail,
                request.getBookingDate(), request.getStartTime(), request.getEndTime());

        return mapToResponse(saved);
    }

    // ==================== Review Booking (Admin) ====================

    /**
     * Admin reviews a booking: approve or reject.
     *
     * Rules:
     * - Only PENDING bookings can be reviewed
     * - REJECTED status requires adminRemarks
     * - Re-checks for conflicts before APPROVING (race condition protection)
     *
     * @param bookingId  the booking to review
     * @param request    the review request (status + remarks)
     * @param adminEmail the admin performing the review
     * @return the updated booking response
     */
    public BookingDTO.BookingResponse reviewBooking(
            Long bookingId,
            BookingDTO.ReviewBookingRequest request,
            String adminEmail) {

        BookingEntity booking = findBookingById(bookingId);

        // Only PENDING bookings can be reviewed
        if (booking.getStatus() != BookingEnums.BookingStatus.PENDING) {
            throw new IllegalArgumentException(
                    "Only PENDING bookings can be reviewed. Current status: " + booking.getStatus());
        }

        // Validate review status is APPROVED or REJECTED
        if (request.getStatus() != BookingEnums.BookingStatus.APPROVED
                && request.getStatus() != BookingEnums.BookingStatus.REJECTED) {
            throw new IllegalArgumentException(
                    "Review status must be APPROVED or REJECTED.");
        }

        // Rejection requires a reason
        if (request.getStatus() == BookingEnums.BookingStatus.REJECTED
                && (request.getAdminRemarks() == null || request.getAdminRemarks().isBlank())) {
            throw new IllegalArgumentException(
                    "Admin remarks are required when rejecting a booking.");
        }

        // Race condition protection: re-check conflicts before approving
        if (request.getStatus() == BookingEnums.BookingStatus.APPROVED) {
            checkForConflicts(
                    booking.getFacility().getId(),
                    booking.getBookingDate(),
                    booking.getStartTime(),
                    booking.getEndTime(),
                    booking.getId());
        }

        // Load admin user
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", adminEmail));

        // Apply review
        booking.setStatus(request.getStatus());
        booking.setAdminRemarks(request.getAdminRemarks());
        booking.setReviewedBy(admin);
        booking.setReviewedAt(LocalDateTime.now());

        BookingEntity saved = bookingRepository.save(booking);
        log.info("Booking reviewed: id={} status={} by={}",
                saved.getId(), saved.getStatus(), adminEmail);

        return mapToResponse(saved);
    }

    // ==================== Cancel Booking ====================

    /**
     * Cancel a booking. Only the booking owner can cancel.
     * Only PENDING or APPROVED bookings can be cancelled.
     *
     * @param bookingId the booking to cancel
     * @param userEmail the email of the requesting user
     * @return the updated booking response
     */
    public BookingDTO.BookingResponse cancelBooking(Long bookingId, String userEmail) {
        BookingEntity booking = findBookingById(bookingId);

        // Only the owner can cancel
        if (!booking.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("You can only cancel your own bookings.");
        }

        // Only PENDING or APPROVED can be cancelled
        if (booking.getStatus() != BookingEnums.BookingStatus.PENDING
                && booking.getStatus() != BookingEnums.BookingStatus.APPROVED) {
            throw new IllegalArgumentException(
                    "Only PENDING or APPROVED bookings can be cancelled. Current status: "
                            + booking.getStatus());
        }

        booking.setStatus(BookingEnums.BookingStatus.CANCELLED);

        BookingEntity saved = bookingRepository.save(booking);
        log.info("Booking cancelled: id={} by={}", saved.getId(), userEmail);

        return mapToResponse(saved);
    }

    // ==================== Read Operations ====================

    /**
     * Get all bookings for the current user.
     *
     * @param userEmail the user's email
     * @return list of the user's booking responses
     */
    @Transactional(readOnly = true)
    public List<BookingDTO.BookingResponse> getUserBookings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        return bookingRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all bookings in the system (admin view) with optional filters.
     *
     * @param status     optional status filter
     * @param facilityId optional facility filter
     * @return list of booking responses
     */
    @Transactional(readOnly = true)
    public List<BookingDTO.BookingResponse> getAllBookings(
            BookingEnums.BookingStatus status, Long facilityId) {

        List<BookingEntity> bookings;

        if (status != null && facilityId != null) {
            bookings = bookingRepository.findByFacilityIdAndStatus(facilityId, status);
        } else if (status != null) {
            bookings = bookingRepository.findByStatus(status);
        } else if (facilityId != null) {
            bookings = bookingRepository.findByFacilityId(facilityId);
        } else {
            bookings = bookingRepository.findAll();
        }

        return bookings.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a booking by ID.
     * Users can only see their own bookings; admins can see any.
     *
     * @param bookingId the booking ID
     * @param userEmail the requesting user's email
     * @param userRole  the requesting user's role
     * @return the booking response
     */
    @Transactional(readOnly = true)
    public BookingDTO.BookingResponse getBookingById(
            Long bookingId, String userEmail, String userRole) {

        BookingEntity booking = findBookingById(bookingId);

        // Non-admin users can only view their own bookings
        if (!"ADMIN".equals(userRole)
                && !booking.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("You can only view your own bookings.");
        }

        return mapToResponse(booking);
    }

    // ==================== Validation Helpers ====================

    /**
     * Validate the booking date/time is not in the past.
     */
    private void validateNotInPast(LocalDate date, LocalTime startTime) {
        LocalDate today = LocalDate.now();
        if (date.isBefore(today)) {
            throw new IllegalArgumentException("Booking date cannot be in the past.");
        }
        if (date.isEqual(today) && startTime.isBefore(LocalTime.now())) {
            throw new IllegalArgumentException(
                    "For same-day bookings, the start time must be in the future.");
        }
    }

    /**
     * Validate booking times fall within the facility's availability window.
     */
    private void validateAvailabilityWindow(
            FacilityEntity facility, LocalTime startTime, LocalTime endTime) {

        if (facility.getAvailableFrom() != null && facility.getAvailableTo() != null) {
            if (startTime.isBefore(facility.getAvailableFrom())) {
                throw new IllegalArgumentException(
                        "Booking start time " + startTime + " is before the facility's "
                                + "availability window (" + facility.getAvailableFrom() + ").");
            }
            if (endTime.isAfter(facility.getAvailableTo())) {
                throw new IllegalArgumentException(
                        "Booking end time " + endTime + " is after the facility's "
                                + "availability window (" + facility.getAvailableTo() + ").");
            }
        }
    }

    /**
     * Validate expected attendees don't exceed facility capacity.
     */
    private void validateCapacity(FacilityEntity facility, Integer expectedAttendees) {
        if (facility.getCapacity() != null && expectedAttendees != null
                && expectedAttendees > facility.getCapacity()) {
            throw new IllegalArgumentException(
                    "Expected attendees (" + expectedAttendees + ") exceeds the facility's "
                            + "capacity (" + facility.getCapacity() + ").");
        }
    }

    /**
     * Check for scheduling conflicts with existing PENDING or APPROVED bookings.
     *
     * @param facilityId       the facility to check
     * @param bookingDate      the booking date
     * @param startTime        the requested start time
     * @param endTime          the requested end time
     * @param excludeBookingId optional booking ID to exclude (for re-check on approval)
     */
    private void checkForConflicts(Long facilityId, LocalDate bookingDate,
                                   LocalTime startTime, LocalTime endTime,
                                   Long excludeBookingId) {
        List<BookingEntity> conflicts = bookingRepository.findConflictingBookings(
                facilityId, bookingDate, startTime, endTime, excludeBookingId);

        if (!conflicts.isEmpty()) {
            BookingEntity conflict = conflicts.get(0);
            throw new BookingConflictException(
                    "Scheduling conflict: this facility is already booked on " + bookingDate
                            + " from " + conflict.getStartTime() + " to " + conflict.getEndTime()
                            + " (booking #" + conflict.getId() + ", status: "
                            + conflict.getStatus() + ").");
        }
    }

    // ==================== Internal Helpers ====================

    private BookingEntity findBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
    }

    /**
     * Map a BookingEntity to a BookingResponse DTO.
     */
    private BookingDTO.BookingResponse mapToResponse(BookingEntity entity) {
        return BookingDTO.BookingResponse.builder()
                .id(entity.getId())
                .facilityId(entity.getFacility().getId())
                .facilityName(entity.getFacility().getName())
                .facilityLocation(entity.getFacility().getLocation())
                .facilityType(entity.getFacility().getFacilityType().name())
                .userId(entity.getUser().getId())
                .userName(entity.getUser().getName())
                .userEmail(entity.getUser().getEmail())
                .bookingDate(entity.getBookingDate())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .purpose(entity.getPurpose())
                .expectedAttendees(entity.getExpectedAttendees())
                .status(entity.getStatus().name())
                .adminRemarks(entity.getAdminRemarks())
                .reviewedByName(entity.getReviewedBy() != null
                        ? entity.getReviewedBy().getName() : null)
                .reviewedAt(entity.getReviewedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
