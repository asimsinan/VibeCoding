const express = require('express');
const router = express.Router();
const knex = require('../db');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await knex('users')
      .where({ email, password }) // In production, use proper password hashing
      .first();

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // In a real app, generate JWT token here
    res.json({ 
      userId: user.id, 
      email: user.email 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
