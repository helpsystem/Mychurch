// lib/axios.ts
import axios from 'axios';

// Determine if we're in development
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// In production, backend serves from same origin on port 3001
// Frontend is on port 5000 (or 80/443), backend on 3001
// So we need to specify the full URL in production too
const getBaseURL = () => {
  if (isDevelopment) {
    return 'http://localhost:3001';
  }
  
  // Production: backend runs on port 3001
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:3001`;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
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
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      console.warn('Unauthorized access - redirecting to login');
      // You can add redirect logic here if needed
    }
    
    // Log error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    return Promise.reject(error);
  }
);

export default api;
