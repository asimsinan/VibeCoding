// Environment configuration
export const config = {
  apiUrl: process.env.NODE_ENV === 'production' 
    ? '/api/v1' 
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'),
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// API endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
  },
  campaigns: {
    list: '/campaigns',
    create: '/campaigns',
    get: (id: string) => `/campaigns/${id}`,
    update: (id: string) => `/campaigns/${id}`,
    delete: (id: string) => `/campaigns/${id}`,
    donations: (id: string) => `/campaigns/${id}/donations`,
    comments: (id: string) => `/campaigns/${id}/comments`,
  },
  users: {
    profile: '/users/profile',
    stats: '/users/stats',
  },
  health: '/health',
};

// Campaign categories
export const campaignCategories = [
  'TECHNOLOGY',
  'ART',
  'MUSIC',
  'FILM',
  'GAMES',
  'DESIGN',
  'PUBLISHING',
  'FOOD',
  'FASHION',
  'HEALTH',
  'EDUCATION',
  'ENVIRONMENT',
  'COMMUNITY',
  'OTHER',
] as const;

export type CampaignCategory = typeof campaignCategories[number];

// Campaign statuses
export const campaignStatuses = [
  'DRAFT',
  'ACTIVE',
  'OPEN',
  'SUSPENDED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type CampaignStatus = typeof campaignStatuses[number];

// User roles
export const userRoles = [
  'USER',
  'ADMIN',
] as const;

export type UserRole = typeof userRoles[number];

// Pagination defaults
export const paginationDefaults = {
  page: 1,
  limit: 20,
  maxLimit: 100,
};

// Form validation rules
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: 'Name must be between 2 and 100 characters',
  },
  campaignTitle: {
    required: true,
    minLength: 5,
    maxLength: 100,
    message: 'Title must be between 5 and 100 characters',
  },
  campaignDescription: {
    required: true,
    minLength: 50,
    maxLength: 5000,
    message: 'Description must be between 50 and 5000 characters',
  },
  campaignGoal: {
    required: true,
    min: 100,
    max: 1000000,
    message: 'Goal must be between $100 and $1,000,000',
  },
  donationAmount: {
    required: true,
    min: 1,
    max: 10000,
    message: 'Donation amount must be between $1 and $10,000',
  },
  commentContent: {
    required: true,
    minLength: 1,
    maxLength: 1000,
    message: 'Comment must be between 1 and 1000 characters',
  },
};

// Date formatting utilities
export const dateFormats = {
  short: 'MMM dd, yyyy',
  long: 'MMMM dd, yyyy',
  datetime: 'MMM dd, yyyy h:mm a',
  iso: 'yyyy-MM-dd',
};

// Currency formatting
export const currencyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

// File upload limits
export const fileLimits = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
};

// Local storage keys
export const storageKeys = {
  authToken: 'auth_token',
  userProfile: 'user_profile',
  theme: 'theme',
  language: 'language',
};

// Error messages
export const errorMessages = {
  network: 'Network error. Please check your connection.',
  unauthorized: 'You are not authorized to perform this action.',
  forbidden: 'Access denied.',
  notFound: 'The requested resource was not found.',
  validation: 'Please check your input and try again.',
  server: 'Server error. Please try again later.',
  generic: 'Something went wrong. Please try again.',
};

// Success messages
export const successMessages = {
  campaignCreated: 'Campaign created successfully!',
  campaignUpdated: 'Campaign updated successfully!',
  campaignDeleted: 'Campaign deleted successfully!',
  donationCreated: 'Thank you for your donation!',
  commentCreated: 'Comment posted successfully!',
  profileUpdated: 'Profile updated successfully!',
  loginSuccess: 'Welcome back!',
  registerSuccess: 'Account created successfully!',
};
