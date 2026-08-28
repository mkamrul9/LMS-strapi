import axios from 'axios';
import { getCookie } from 'cookies-next';

/**
 * Centralized Axios instance configured to communicate with the Strapi backend.
 * Uses environment variables for flexible deployment targets (Localhost vs Railway).
 */
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Automatically injects the JWT into the Authorization header of every outbound request,
 * eliminating the need to manually pass tokens in component-level API calls.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getCookie('jwt');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Globally catches failed requests. Specifically designed to identify 401 Unauthorized errors,
 * which indicate a stale or compromised session. Actual cleanup routing is handled by the AuthContext/Middleware.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request - Token missing, expired, or invalid signature.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
