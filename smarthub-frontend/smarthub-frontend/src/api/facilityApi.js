import api from './axios';

/**
 * API layer for Facilities & Assets Catalogue.
 * All functions return the Axios response promise.
 */

/**
 * Get all facilities.
 */
export const getAllFacilities = () => api.get('/api/facilities');

/**
 * Get a specific facility by ID.
 */
export const getFacilityById = (id) => api.get(`/api/facilities/${id}`);

/**
 * Search/filter facilities with optional query parameters.
 * @param {Object} params - { keyword, type, status, minCapacity, location }
 */
export const searchFacilities = (params) =>
  api.get('/api/facilities/search', { params });

/**
 * Create a new facility (ADMIN only).
 * @param {Object} data - CreateFacilityRequest body
 */
export const createFacility = (data) => api.post('/api/facilities', data);

/**
 * Update an existing facility (ADMIN only).
 * @param {number} id - Facility ID
 * @param {Object} data - UpdateFacilityRequest body
 */
export const updateFacility = (id, data) =>
  api.put(`/api/facilities/${id}`, data);

/**
 * Delete a facility (ADMIN only).
 * @param {number} id - Facility ID
 */
export const deleteFacility = (id) => api.delete(`/api/facilities/${id}`);
