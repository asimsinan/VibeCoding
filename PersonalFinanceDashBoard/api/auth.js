const knex = require('knex');

// Create a connection pool outside the handler to reuse connections
let dbPool = null;

function getDbConnection() {
  if (!dbPool) {
    console.log('Creating new database connection pool');
    dbPool = knex({
      client: 'pg',
      connection: {
        connectionString: process.env.NEON_DATABASE_URL,
        ssl: { 
          rejectUnauthorized: false,
          // Add additional SSL options if needed
        }
      },
      pool: {
        min: 0,
        max: 5,
        createTimeoutMillis: 3000,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100,
        propagateCreateError: false
      }
    });
  }
  return dbPool;
}

module.exports = async function handler(req, res) {
  // Log the full request details
  console.log('Received request:', {
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query,
    env: {
      NEON_DATABASE_URL: process.env.NEON_DATABASE_URL ? 'SET' : 'UNSET'
    }
  });

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST method for login
  if (req.method !== 'POST') {
    console.warn('Invalid method for login', { method: req.method });
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  // Ensure request body is parsed
  if (!req.body) {
    console.error('No request body received');
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    console.error('Missing email or password', { email: !!email, password: !!password });
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  // Hardcode the demo credentials for now
  const DEMO_EMAIL = 'demo@example.com';
  const DEMO_PASSWORD = 'demo_password_hash';

  let db;
  try {
    // Get database connection
    db = getDbConnection();

    // Log database connection details
    console.log('Database connection established');

    // Find user by email
    const user = await db('users')
      .where({ email: DEMO_EMAIL })
      .first();

    // Log user lookup result
    console.log('User lookup result:', user ? 'User found' : 'User not found', { email: DEMO_EMAIL });

    // Simple password check (in a real app, use bcrypt)
    if (!user || user.password_hash !== DEMO_PASSWORD) {
      console.warn('Invalid login attempt', { email });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate a simple JWT (in a real app, use a proper JWT library)
    const token = Buffer.from(JSON.stringify(user)).toString('base64');

    // Return user info and token
    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.username
      }
    });
  } catch (error) {
    // Log full error details
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      env: {
        NEON_DATABASE_URL: process.env.NEON_DATABASE_URL ? 'SET' : 'UNSET'
      }
    });

    // Send generic error response
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
