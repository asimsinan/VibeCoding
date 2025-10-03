/**
 * Environment Configuration Example
 * Copy this file to .env.local and update with your actual values
 */

export const environmentExample = {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: 'your_supabase_project_url',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your_supabase_anon_key',
  SUPABASE_SERVICE_ROLE_KEY: 'your_supabase_service_role_key',

  // Database Connection Settings
  DATABASE_MAX_CONNECTIONS: '20',
  DATABASE_CONNECTION_TIMEOUT: '30000',
  DATABASE_RETRY_ATTEMPTS: '3',
  DATABASE_RETRY_DELAY: '1000',

  // Application Settings
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: 'your_nextauth_secret',
  NEXTAUTH_URL: 'http://localhost:3000',

  // Real-time Communication (Pusher)
  NEXT_PUBLIC_PUSHER_KEY: 'your_pusher_key',
  PUSHER_SECRET: 'your_pusher_secret',
  PUSHER_CLUSTER: 'us2',

  // Development Settings
  NODE_ENV: 'development',
  LOG_LEVEL: 'debug'
}

/**
 * Required Environment Variables
 * These must be set for the application to function
 */
export const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

/**
 * Optional Environment Variables
 * These have default values but can be customized
 */
export const optionalEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_MAX_CONNECTIONS',
  'DATABASE_CONNECTION_TIMEOUT',
  'DATABASE_RETRY_ATTEMPTS',
  'DATABASE_RETRY_DELAY',
  'NEXT_PUBLIC_APP_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_PUSHER_KEY',
  'PUSHER_SECRET',
  'PUSHER_CLUSTER',
  'NODE_ENV',
  'LOG_LEVEL'
]

/**
 * Environment Validation
 * Validates that all required environment variables are set
 */
export const validateEnvironment = (): { isValid: boolean; missing: string[] } => {
  const missing: string[] = []
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  })

  return {
    isValid: missing.length === 0,
    missing
  }
}
