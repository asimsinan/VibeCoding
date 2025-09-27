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
  // EXTREME LOGGING: Log EVERYTHING possible
  console.log('🔍 FULL LOGIN REQUEST DIAGNOSTIC', {
    timestamp: new Date().toISOString(),
    method: req.method,
    fullHeaders: JSON.stringify(req.headers),
    contentType: req.headers['content-type'],
    rawBody: req.rawBody ? req.rawBody.toString() : 'NO RAW BODY',
    body: JSON.stringify(req.body),
    query: JSON.stringify(req.query),
    env: {
      NEON_DATABASE_URL: process.env.NEON_DATABASE_URL ? 'SET' : 'UNSET',
      NODE_ENV: process.env.NODE_ENV
    }
  });

  // Enable CORS with more permissive settings
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
    console.warn('❌ Invalid method for login', { method: req.method });
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  // EXTREME PARSING: Try multiple ways to get the body
  let body;
  try {
    body = req.body || 
      (req.rawBody ? JSON.parse(req.rawBody.toString()) : 
      (req.query || {}));
  } catch (parseError) {
    console.error('❌ BODY PARSING ERROR', {
      error: parseError.message,
      rawBody: req.rawBody ? req.rawBody.toString() : 'NO RAW BODY',
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : 'NO BODY'
    });
    body = {};
  }

  console.log('🕵️ PARSED REQUEST BODY', JSON.stringify(body, null, 2));

  const { email, password } = body;

  // Validate input with extreme logging
  if (!email || !password) {
    console.error('❌ MISSING CREDENTIALS', { 
      emailProvided: !!email,
      passwordProvided: !!password,
      emailType: typeof email,
      passwordType: typeof password
    });
    res.status(400).json({ 
      error: 'Email and password are required',
      details: {
        emailProvided: !!email,
        passwordProvided: !!password,
        emailType: typeof email,
        passwordType: typeof password
      }
    });
    return;
  }

  let db;
  try {
    // Get database connection
    db = getDbConnection();

    console.log('🔐 Attempting database lookup', {
      email: email.toLowerCase().trim(),
      emailLength: email.length
    });

    // Fetch ALL columns to see what's actually in the database
    const users = await db('users')
      .select('*')
      .where('email', email.toLowerCase().trim());

    console.log('🔍 FULL USER LOOKUP RESULTS', {
      usersFound: users.length,
      userDetails: users.map(u => ({
        id: u.id,
        email: u.email,
        passwordExists: !!u.password,
        passwordLength: u.password ? u.password.length : 'N/A',
        fullUserRecord: JSON.stringify(u)
      }))
    });

    const user = users[0];

    // Detailed authentication logging
    if (!user) {
      // If no user found, log ALL users in the database
      const allUsers = await db('users').select('id', 'email');
      console.warn('❌ NO USER FOUND', {
        providedEmail: email,
        allUserEmails: allUsers.map(u => u.email)
      });
      res.status(401).json({ 
        error: 'Invalid credentials',
        details: {
          userFound: false,
          providedEmail: email,
          allEmails: allUsers.map(u => u.email)
        }
      });
      return;
    }

    // Extremely detailed password check
    console.log('🔑 PASSWORD VERIFICATION', {
      storedPassword: user.password,
      providedPassword: password,
      passwordMatch: user.password === password,
      userDetails: {
        id: user.id,
        email: user.email
      }
    });

    // Password check
    if (user.password !== password) {
      console.warn('❌ PASSWORD MISMATCH', { 
        storedPassword: user.password,
        providedPassword: password,
        userDetails: {
          id: user.id,
          email: user.email
        }
      });
      res.status(401).json({ 
        error: 'Invalid credentials',
        details: {
          passwordMismatch: true,
          storedPasswordExists: !!user.password,
          storedPasswordLength: user.password ? user.password.length : 'N/A'
        }
      });
      return;
    }

    // Generate a simple JWT (in a real app, use a proper JWT library)
    const token = Buffer.from(JSON.stringify(user)).toString('base64');

    // Return user info and token with extreme details
    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: 'Demo User'
      },
      details: {
        loginAttempt: 'Successful',
        tokenGenerated: true,
        userDetails: {
          id: user.id,
          email: user.email
        }
      }
    });
  } catch (error) {
    // Log full error details with comprehensive information
    console.error('❌ CRITICAL LOGIN ERROR', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      type: typeof error,
      keys: Object.keys(error),
      env: {
        NEON_DATABASE_URL: process.env.NEON_DATABASE_URL ? 'SET' : 'UNSET'
      }
    });

    // Send generic error response with optional details
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : undefined
    });
  }
};
