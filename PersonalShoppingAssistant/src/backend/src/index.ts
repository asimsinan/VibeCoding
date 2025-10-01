/**
 * Backend Entry Point
 * 
 * This file serves as the main entry point for the backend application
 * and exports the Express app for Vercel deployment.
 */

import { App } from './app';

// Create app instance
const app = new App();

// Export the Express app for Vercel
export default app.getApp();
