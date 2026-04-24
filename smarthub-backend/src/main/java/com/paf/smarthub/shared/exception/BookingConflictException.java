package com.paf.smarthub.shared.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a booking request conflicts with an existing booking.
 * Results in HTTP 409 Conflict response.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class BookingConflictException extends RuntimeException {

    public BookingConflictException(String message) {
        super(message);
    }
}
