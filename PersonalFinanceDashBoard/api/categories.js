const getKnex = require('./db');
const url = require('url');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
};

// Predefined demo user ID
const DEMO_USER_ID = 'a22002ba-8d08-41d4-8c07-62784123244a';

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get Knex instance
  const knex = getKnex();

  try {
    // Parse the URL to extract category ID
    const parsedUrl = url.parse(req.url, true);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    const categoryId = pathParts[pathParts.length - 1];

    console.log('Category API Request:', {
      method: req.method,
      categoryId,
      body: req.body,
      query: parsedUrl.query
    });

    switch (req.method) {
      case 'GET':
        // Fetch categories for the demo user
        const categories = await knex('categories')
          .where('user_id', DEMO_USER_ID)
          .orderBy('name', 'asc');
        
        res.status(200).json(categories);
        break;

      case 'DELETE':
        if (!categoryId) {
          res.status(400).json({ error: 'Category ID is required' });
          return;
        }

        // Check if the category exists and belongs to the demo user
        const category = await knex('categories')
          .where({ 
            id: categoryId, 
            user_id: DEMO_USER_ID 
          })
          .first();

        if (!category) {
          res.status(404).json({ error: 'Category not found' });
          return;
        }

        // Check if the category is associated with any transactions
        const transactionCount = await knex('transactions')
          .where('category_id', categoryId)
          .count('* as count')
          .first();

        if (Number(transactionCount.count) > 0) {
          res.status(400).json({ 
            error: 'Cannot delete category with associated transactions' 
          });
          return;
        }

        // Delete the category
        await knex('categories')
          .where({ 
            id: categoryId, 
            user_id: DEMO_USER_ID 
          })
          .del();

        res.status(200).json({ 
          message: 'Category deleted successfully',
          categoryId 
        });
        break;

      case 'POST':
        // Create a new category
        const { name, type } = req.body;

        if (!name || !type) {
          res.status(400).json({ error: 'Name and type are required' });
          return;
        }

        const newCategory = await knex('categories')
          .insert({
            name,
            type,
            user_id: DEMO_USER_ID
          })
          .returning('*');

        res.status(201).json(newCategory[0]);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Categories API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};
