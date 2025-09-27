const getKnex = require('./db');

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

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
};

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).json({
      headers: corsHeaders
    });
    return;
  }

  // Only allow POST method for login
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

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
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Get Knex instance
    const knex = getKnex();

    // Check database connection
    try {
      await knex.raw('SELECT 1');
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      res.status(500).json({ 
        error: 'Database connection failed', 
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined 
      });
      return;
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
      res.status(500).json({ 
        error: 'User lookup failed', 
        details: process.env.NODE_ENV === 'development' ? queryError.message : undefined 
      });
      return;
    }

    console.log('User lookup result:', user ? 'User found' : 'User not found', 
      user ? { 
        id: user.id, 
        email: user.email, 
        passwordLength: user.password ? user.password.length : 'N/A' 
      } : null
    );

    if (!user) {
      res.status(401).json({ 
        error: 'Invalid login attempt', 
        details: { 
          email, 
          userCount: (await knex('users').count('* as count').first()).count 
        } 
      });
      return;
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
      res.status(401).json({ 
        error: 'Invalid credentials', 
        details: { 
          email, 
          passwordMatch: false 
        } 
      });
      return;
    }

    // In a real app, generate JWT token here
    res.status(200).json({ 
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
};
