import axios from 'axios';
import config from '../config/environment';

// Configure axios global defaults
axios.defaults.baseURL = config.FULL_API_URL || config.API_BASE_URL.replace(/\/api$/, '');
axios.defaults.timeout = config.API_TIMEOUT || 30000;

// Ensure each request includes Authorization header from localStorage (if present).
// This avoids timing issues where AuthContext hasn't yet set defaults.
axios.interceptors.request.use(
  (req) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        req.headers = req.headers || {};
        req.headers.Authorization = `Bearer ${token}`;
      } else {
        // Remove any leftover header to avoid sending malformed values
        if (req.headers && req.headers.Authorization) delete req.headers.Authorization;
      }
    } catch (e) {
      // ignore storage errors
    }
    return req;
  },
  (error) => Promise.reject(error)
);

export default axios;
