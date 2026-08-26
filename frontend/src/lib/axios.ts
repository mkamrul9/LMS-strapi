import axios from 'axios';

// 1. Create a centralized Axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor (Prepares for Phase 14 Auth)
apiClient.interceptors.request.use(
  (config) => {
    // In the next phase, we will extract the JWT from the browser cookie
    // and inject it here automatically for every protected request.
    
    // For now, return the config as-is
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor (Global Error Handling)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Global handler for unauthorized requests
    if (error.response && error.response.status === 401) {
      // Trigger logout logic / redirect to login (implemented later)
      console.warn('Unauthorized request - Token missing or expired');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
