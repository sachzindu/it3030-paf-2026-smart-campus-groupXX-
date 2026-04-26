package com.paf.smarthub.booking;

/**
 * Enumerations for the Booking Management module.
 */
public class BookingEnums {

    /**
     * Booking lifecycle status.
     * Workflow: PENDING → APPROVED / REJECTED
     * Approved bookings can later be CANCELLED.
     * Pending bookings can also be CANCELLED by the requester.
     */
    public enum BookingStatus {
        PENDING,
        APPROVED,
        REJECTED,
        CANCELLED
    }
}
