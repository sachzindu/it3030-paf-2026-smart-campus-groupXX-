import api from './axios';

/**
 * API layer for Booking Management.
 * All functions return the Axios response promise.
 */

/**
 * Create a new booking request.
 * @param {Object} data - { facilityId, bookingDate, startTime, endTime, purpose, expectedAttendees }
 */
export const createBooking = (data) => api.post('/api/bookings', data);

/**
 * Get the current user's bookings.
 */
export const getMyBookings = () => api.get('/api/bookings/my');

/**
 * Get a specific booking by ID (owner or admin).
 */
export const getBookingById = (id) => api.get(`/api/bookings/${id}`);

/**
 * Get all bookings with optional filters (ADMIN only).
 * @param {Object} params - { status, facilityId }
 */
export const getAllBookings = (params) =>
  api.get('/api/bookings', { params });

/**
 * Approve or reject a booking (ADMIN only).
 * @param {number} id - Booking ID
 * @param {Object} data - { status: 'APPROVED'|'REJECTED', adminRemarks }
 */
export const reviewBooking = (id, data) =>
  api.put(`/api/bookings/${id}/review`, data);

/**
 * Cancel a booking (owner only).
 * @param {number} id - Booking ID
 */
export const cancelBooking = (id) => api.put(`/api/bookings/${id}/cancel`);
