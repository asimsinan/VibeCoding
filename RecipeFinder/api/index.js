/**
 * Vercel Serverless Function Entry Point
 * This file serves as the main entry point for Vercel deployment
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import our existing API components
const { createApp } = require('../dist/api/app');
const { SQLiteDatabase } = require('../dist/lib/database/SQLiteDatabase');
const { ServerlessDatabase } = require('../dist/lib/database/ServerlessDatabase');

const app = express();

// Security middleware - simplified for development
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : process.env.NODE_ENV === 'production' 
    ? false 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Request logging
app.use(morgan('combined'));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
  etag: true,
  lastModified: true
}));

// Initialize database - use serverless for Vercel, SQLite for local development
const isVercel = process.env.VERCEL === '1';
const database = isVercel 
  ? new ServerlessDatabase()
  : new SQLiteDatabase('./recipe-finder.db');

// Initialize the database
database.initialize().then(() => {
  console.log(`✅ Database initialized successfully (${isVercel ? 'serverless' : 'SQLite'})`);
}).catch((error) => {
  console.error('❌ Database initialization failed:', error);
  if (!isVercel) {
    process.exit(1);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve static pages
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'contact.html'));
});

// Handle contact form submission
app.post('/contact', (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Name, email, and message are required',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Please provide a valid email address',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }
    
    // In a real application, you would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Send auto-reply to user
    
    // For now, just log the contact form data
    console.log('Contact form submission:', {
      name,
      email,
      subject: subject || 'No subject',
      message,
      timestamp: new Date().toISOString()
    });
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
      statusCode: 200,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Something went wrong. Please try again later.',
      statusCode: 500,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'privacy.html'));
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'terms.html'));
});

// Create API app
const apiApp = createApp(database);

// Mount API routes
app.use('/', apiApp);

// Serve the main HTML file for all other non-API routes
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'API endpoint not found'
    });
  }
  
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Export the app for Vercel
module.exports = app;
