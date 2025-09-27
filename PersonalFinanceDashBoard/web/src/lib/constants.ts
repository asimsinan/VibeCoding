// Application Constants
export const APP_CONFIG = {
  // Demo user ID (in production, this should come from authentication)
  DEMO_USER_ID: 'a22002ba-8d08-41d4-8c07-62784123244a',
  
  // API endpoints
  API_ENDPOINTS: {
    DASHBOARD: '/api/dashboard',
    TRANSACTIONS: '/api/transactions',
    CATEGORIES: '/api/categories'
  },
  
  // Production URLs
  PRODUCTION_URL: 'https://personalfinancedashboard-asimsinans-projects.vercel.app',
  PRODUCTION_API_URL: 'https://personalfinancedashboard-asimsinans-projects.vercel.app/api'
};

// Helper function to get current user ID
// In a real app, this would come from authentication context
export const getCurrentUserId = (): string => {
  return APP_CONFIG.DEMO_USER_ID;
};
