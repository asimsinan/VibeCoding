import axios from 'axios';

const API_BASE_URL = 'https://api-mocha-iota-21.vercel.app/api/v1';
// Cache bust with timestamp
const CACHE_BUSTER = `?cb=${Date.now()}&v=${Math.random().toString(36).substr(2, 9)}`;
console.log('🔗 API Client initialized with URL:', API_BASE_URL);
console.log('🚫 Cache buster:', CACHE_BUSTER);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for large image uploads
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
});

// Add cache busting to all requests
apiClient.interceptors.request.use((config) => {
  if (config.url) {
    config.url += CACHE_BUSTER;
  }
  return config;
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
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
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

