import api from './axios';
import { API_BASE_URL } from './axios';

/**
 * API layer for Facilities & Assets Catalogue.
 * All functions return the Axios response promise.
 */

export const getResponseData = (response) => response.data?.data ?? response.data;

export const resolveFacilityImageUrl = (imageUrl) => {
  if (!imageUrl) {
    return '';
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }

  return `${API_BASE_URL}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
};

/**
 * Get all facilities with optional filtering.
 * @param {string} type - Facility type filter (optional)
 * @param {string} status - Facility status filter (optional)
 */
export const getAllFacilities = (type = '', status = '') => {
  const params = {};
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
 * Search/filter facilities using the backend's query-parameter contract.
 * @param {Object} searchParams - { keyword, type, status, minCapacity, location }
 */
export const searchFacilities = (searchParams = {}) => {
  const params = {};

  if (searchParams.keyword) params.keyword = searchParams.keyword;
  if (searchParams.type) params.type = searchParams.type;
  if (searchParams.status) params.status = searchParams.status;
  if (searchParams.minCapacity) params.minCapacity = searchParams.minCapacity;
  if (searchParams.location) params.location = searchParams.location;

  return api.get('/api/facilities/search', { params });
};

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
 * Upload a facility image file and get the stored URL.
 * @param {File} file - Image file from the local computer
 */
export const uploadFacilityImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/api/facilities/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Delete a facility (ADMIN only).
 * @param {number} id - Facility ID
 */
export const deleteFacility = (id) => api.delete(`/api/facilities/${id}`);
