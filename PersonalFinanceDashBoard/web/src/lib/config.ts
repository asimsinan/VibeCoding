// API Configuration
export const API_CONFIG = {
  // Use environment variable if available, otherwise fallback to localhost
  // For Vercel deployment, this will be automatically set to the same domain
  BASE_URL: (import.meta as any).env.PROD 
    ? 'https://personalfinancedashboard.vercel.app/api' 
    : 'http://localhost:3001/api',
  
  // Default auth token (can be overridden)
  DEFAULT_AUTH_TOKEN: 'your-auth-token'
};

// Production API URL
export const PRODUCTION_API_URL = 'https://personalfinancedashboard.vercel.app/api';

// Helper function to get the API base URL
export const getApiBaseUrl = (): string => {
  // Explicitly log the base URL for debugging
  console.log('Current API Base URL:', API_CONFIG.BASE_URL);
  return API_CONFIG.BASE_URL;
};
