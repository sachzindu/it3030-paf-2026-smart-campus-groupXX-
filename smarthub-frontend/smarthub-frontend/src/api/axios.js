import axios from 'axios';

// Dynamically use the same hostname the browser used to load the app.
// This ensures API calls work from localhost AND from phones on the same Wi-Fi.
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:8080`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor: attach JWT token from localStorage
 * to every outgoing request's Authorization header.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smarthub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor: handle 401 responses by clearing
 * auth state and redirecting to login.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('smarthub_token');
      localStorage.removeItem('smarthub_user');
      // Only redirect if not already on login/signup pages
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
