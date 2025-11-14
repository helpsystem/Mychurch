// lib/axios.ts
import axios from 'axios';

// Determine if we're in development
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// In production, use full URL to avoid HTTP/2 issues with nginx proxy
const getBaseURL = () => {
  if (isDevelopment) {
    return 'http://localhost:3001';
  }
  
  // Production: use full URL to avoid HTTP/2 protocol issues
  return 'https://samanabyar.online';
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
  // Add timeout to prevent hanging requests
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage or cookies
    const token = localStorage.getItem('token') || 
                  document.cookie
                    .split('; ')
                    .find(row => row.startsWith('token='))
                    ?.split('=')[1];
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn('Unauthorized access - please login again');
      // Clear stored token
      localStorage.removeItem('token');
      // You can add redirect to login page here if needed
      window.location.href = '/#/login';
    }
    
    // Handle HTTP/2 protocol errors by logging them
    if (error.code === 'ERR_NETWORK' && error.message.includes('HTTP/2')) {
      console.warn('HTTP/2 protocol error detected - this may be a proxy issue');
    }
    
    // Log error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    
    return Promise.reject(error);
  }
);

export default api;
