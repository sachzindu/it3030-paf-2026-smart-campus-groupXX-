/* eslint-disable no-unused-vars */
import api from './axios';

/**
 * Create a new incident. Since we send files, we must use FormData.
 */
export const createIncident = (formData) => 
  api.post('/api/incidents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const getMyIncidents = () => api.get('/api/incidents/my');

export const getAllIncidents = (params) => api.get('/api/incidents', { params });

export const getAssignedIncidents = () => api.get('/api/incidents/assigned');

export const getIncidentById = (id) => api.get(`/api/incidents/${id}`);

export const assignTechnician = (id, data) => api.put(`/api/incidents/${id}/assign`, data);

export const updateStatus = (id, data) => api.put(`/api/incidents/${id}/status`, data);

export const updateIncident = (id, formData) =>
  api.put(`/api/incidents/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const deleteIncident = (id) => api.delete(`/api/incidents/${id}`);

export const updatePriority = (id, data) => api.put(`/api/incidents/${id}/priority`, data);

export const getComments = (id) => api.get(`/api/incidents/${id}/comments`);

export const addComment = (id, data) => api.post(`/api/incidents/${id}/comments`, data);

export const deleteComment = (commentId) => api.delete(`/api/incidents/comments/${commentId}`);

/** Fetch users by role — used to populate the technician assignment dropdown */
export const getUsersByRole = (role) => api.get(`/api/auth/users/role/${role}`);

export const incidentApi = {
  createIncident,
  getMyIncidents,
  getAllIncidents,
  getAssignedIncidents,
  getIncidentById,
  assignTechnician,
  updateStatus,
  updateIncident,
  deleteIncident,
  updatePriority,
  getComments,
  addComment,
  deleteComment,
  getUsersByRole,
};

void updateIncident;
void deleteIncident;

