import api from './axios';

/**
 * API layer for Facilities & Assets Catalogue.
 * All functions return the Axios response promise.
 */

/**
 * Get all facilities with pagination and filtering.
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Page size
 * @param {string} type - Facility type filter (optional)
 * @param {string} status - Facility status filter (optional)
 */
export const getAllFacilities = (page = 0, size = 12, type = '', status = '') => {
  const params = { page, size };
  if (type) params.type = type;
  if (status) params.status = status;
  return api.get('/api/facilities', { params });
};

/**
 * Get a specific facility by ID.
 * @param {number} id - Facility ID
 */
export const getFacilityById = (id) => api.get(`/api/facilities/${id}`);

/**
 * Search/filter facilities with advanced search criteria.
 * @param {Object} searchRequest - { name, type, minCapacity, maxCapacity, location, status, availabilityDate, availabilityStartTime, availabilityEndTime }
 */
export const searchFacilities = (searchRequest) =>
  api.post('/api/facilities/search', searchRequest);

/**
 * Check facility availability for a specific time slot.
 * @param {number} facilityId - Facility ID
 * @param {Object} availabilityRequest - { bookingDate, startTime, endTime }
 */
export const checkAvailability = (facilityId, availabilityRequest) =>
  api.post(`/api/facilities/${facilityId}/check-availability`, availabilityRequest);

/**
 * Create a new facility (ADMIN only).
 * @param {Object} createRequest - CreateFacilityRequest body
 */
export const createFacility = (createRequest) =>
  api.post('/api/facilities', createRequest);

/**
 * Update an existing facility (ADMIN only).
 * @param {number} id - Facility ID
 * @param {Object} updateRequest - UpdateFacilityRequest body
 */
export const updateFacility = (id, updateRequest) =>
  api.put(`/api/facilities/${id}`, updateRequest);

/**
 * Update facility status (ADMIN only).
 * @param {number} id - Facility ID
 * @param {string} status - New status (ACTIVE, OUT_OF_SERVICE, MAINTENANCE)
 */
export const updateFacilityStatus = (id, status) =>
  api.patch(`/api/facilities/${id}/status`, { status });

/**
 * Delete a facility (ADMIN only).
 * @param {number} id - Facility ID
 */
export const deleteFacility = (id) => api.delete(`/api/facilities/${id}`);

/**
 * Get QR code PNG image for a facility (returns blob).
 * @param {number} id - Facility ID
 * @param {string} baseUrl - Frontend base URL encoded in the QR code
 */
export const getFacilityQrCode = (id, baseUrl = window.location.origin) =>
  api.get(`/api/facilities/${id}/qr-code`, {
    responseType: 'blob',
    params: { baseUrl },
  });
