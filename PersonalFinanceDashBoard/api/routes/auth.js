const express = require('express');
const router = express.Router();
const knex = require('../db');

// Predefined demo users for testing
const DEMO_USERS = [
  {
    email: 'demo@example.com',
    password: 'demo_password_hash',
    userId: 'a22002ba-8d08-41d4-8c07-62784123244a'
  },
  {
    email: 'user2@example.com',
    password: 'user2_password_hash',
    userId: 'b33113cb-9d09-5d5f-9c07-73834123245b'
  }
];

// Middleware to log all requests
router.use((req, res, next) => {
  console.log('Auth Request:', {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: {
      'content-type': req.get('content-type'),
      'authorization': req.get('authorization')
    }
  });
  next();
});

// CORS preflight handler
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

// Login route
router.post('/login', async (req, res) => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { 
      email, 
      password: password ? '[REDACTED]' : 'MISSING',
      env: {
        NODE_ENV: process.env.NODE_ENV,
        NEON_DATABASE_URL: process.env.NEON_DATABASE_URL ? '[PRESENT]' : '[MISSING]'
      }
    });

    // Validate input
    if (!email || !password) {
      console.error('Login failed: Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check database connection
    try {
      await knex.raw('SELECT 1');
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({ 
        error: 'Database connection failed', 
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined 
      });
    }

    // Fetch and log all users for debugging
    try {
      const allUsers = await knex('users').select('id', 'email', 'password');
      console.log('All existing users:', allUsers);
    } catch (listError) {
      console.error('Error listing users:', listError);
    }

    // Find user
    let user;
    try {
      user = await knex('users')
        .where({ 
          email: email.toLowerCase()
        })
        .first();
    } catch (queryError) {
      console.error('User query error:', queryError);
      return res.status(500).json({ 
        error: 'User lookup failed', 
        details: process.env.NODE_ENV === 'development' ? queryError.message : undefined 
      });
    }

    console.log('User lookup result:', user ? 'User found' : 'User not found', 
      user ? { 
        id: user.id, 
        email: user.email, 
        passwordLength: user.password ? user.password.length : 'N/A' 
      } : null
    );

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid login attempt', 
        details: { 
          email, 
          userCount: (await knex('users').count('* as count').first()).count 
        } 
      });
    }

    // Check password (for demo, allow both hardcoded and current password)
    const isValidPassword = 
      password === user.password || 
      DEMO_USERS.some(demoUser => 
        demoUser.email === email && demoUser.password === password
      );

    console.log('Password validation:', {
      inputPassword: password,
      storedPassword: user.password,
      isValidPassword,
      demoUserMatch: DEMO_USERS.some(demoUser => 
        demoUser.email === email && demoUser.password === password
      )
    });

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        details: { 
          email, 
          passwordMatch: false 
        } 
      });
    }

    // In a real app, generate JWT token here
    res.json({ 
      userId: user.id, 
      email: user.email 
    });
  } catch (error) {
    console.error('Unexpected login error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

module.exports = router;
