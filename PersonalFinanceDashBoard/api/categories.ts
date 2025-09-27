import { VercelRequest, VercelResponse } from '@vercel/node';
import knex, { Knex } from 'knex';
import { parse } from 'url';

// Create a connection pool outside the handler to reuse connections
let dbPool: Knex | null = null;

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extensive logging for debugging
  console.log('Full Request Details:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body,
    pathname: parse(req.url || '').pathname
  });

  // Set CORS headers with more permissive settings
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers', 
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let db: Knex;
  try {
    // Get database connection
    db = getDbConnection();

    // Parse the URL to extract the category ID
    const parsedUrl = parse(req.url || '', true);
    const pathParts = parsedUrl.pathname?.split('/').filter(Boolean);
    
    // Determine the method and category ID
    const method = req.method;
    const categoryId = 
      req.query.id || 
      req.query.categoryId || 
      (pathParts && pathParts[pathParts.length - 1]) || 
      (typeof req.body === 'object' && (req.body.id || req.body.categoryId));

    console.log('Parsed Request Details:', {
      method,
      categoryId,
      pathParts,
      queryId: req.query.id,
      queryParamId: req.query.categoryId,
      bodyId: req.body?.id,
      bodyCategoryId: req.body?.categoryId
    });

    // Validate method
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
    if (!allowedMethods.includes(method || '')) {
      console.error('Invalid method:', method);
      res.setHeader('Allow', allowedMethods);
      res.status(405).end(`Method ${method} Not Allowed`);
      return;
    }

    // Validate category ID for methods that require it
    if ((method === 'PUT' || method === 'DELETE') && !categoryId) {
      console.error('No category ID provided', { method });
      res.status(400).json({ error: 'Category ID is required' });
      return;
    }

    switch (method) {
      case 'GET':
        // Get categories for a specific user
        const { userId } = req.query;
        
        let queryBuilder = db('categories')
          .select('*')
          .where('user_id', userId || 'a22002ba-8d08-41d4-8c07-62784123244a')
          .orderBy('name', 'asc');
        
        const categories = await queryBuilder;
        res.status(200).json(categories);
        break;
      
      case 'POST':
        // Create new category
        const { name, type } = req.body;
        
        if (!name || !type) {
          return res.status(400).json({ 
            error: 'Missing required fields: name, type' 
          });
        }

        const [newCategory] = await db('categories')
          .insert({
            name,
            type,
            user_id: 'a22002ba-8d08-41d4-8c07-62784123244a' // TODO: Get from auth - using demo user for now
          })
          .returning('*');

        res.status(201).json(newCategory);
        break;

      case 'PUT':
        // Update category
        const updateData: any = {};
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.type !== undefined) updateData.type = req.body.type;

        const [updatedCategory] = await db('categories')
          .where({ id: categoryId })
          .update(updateData)
          .returning('*');

        if (!updatedCategory) {
          return res.status(404).json({ error: 'Category not found' });
        }

        res.status(200).json(updatedCategory);
        break;

      case 'DELETE':
        // First, check if the category exists and belongs to the demo user
        const categoryToDelete = await db('categories')
          .where({ 
            id: categoryId, 
            user_id: 'a22002ba-8d08-41d4-8c07-62784123244a' 
          })
          .first();

        console.log('Category Lookup Result:', { 
          categoryToDelete: !!categoryToDelete,
          categoryId,
          demoUserId: 'a22002ba-8d08-41d4-8c07-62784123244a'
        });

        if (!categoryToDelete) {
          console.error('Category not found or unauthorized', { 
            categoryId, 
            userId: 'a22002ba-8d08-41d4-8c07-62784123244a' 
          });
          res.status(404).json({ error: 'Category not found or unauthorized' });
          return;
        }

        // Check if the category is used in any transactions
        const transactionsWithCategory = await db('transactions')
          .where('category_id', categoryId)
          .count('* as count')
          .first();

        console.log('Transactions with Category:', {
          categoryId,
          transactionCount: transactionsWithCategory?.count
        });

        if (transactionsWithCategory && Number(transactionsWithCategory.count) > 0) {
          console.error('Cannot delete category with existing transactions', { 
            categoryId, 
            transactionCount: transactionsWithCategory.count 
          });
          res.status(400).json({ 
            error: 'Cannot delete category with existing transactions' 
          });
          return;
        }

        // Delete the category
        const deletedCount = await db('categories')
          .where({ id: categoryId })
          .del();

        console.log('Category Deletion Result:', { 
          categoryId, 
          deletedCount 
        });

        if (deletedCount === 0) {
          console.error('Category deletion failed', { categoryId });
          res.status(404).json({ error: 'Category not found' });
          return;
        }

        // Successful deletion
        res.status(204).end();
        break;
      
      case 'OPTIONS':
        // Preflight request, already handled at the top of the function
        res.status(200).end();
        break;
      
      default:
        res.setHeader('Allow', allowedMethods);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    // Log full error details
    console.error('API Error during category operation:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      method: req.method,
      url: req.url,
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
}
