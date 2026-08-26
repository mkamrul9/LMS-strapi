import axios from 'axios';
import { getCookie } from 'cookies-next';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT to every request if it exists
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

// Response Interceptor: Handle global 401s
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // We will handle the actual redirect in the AuthContext or Middleware
      console.warn('Unauthorized request - Token missing or expired');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
