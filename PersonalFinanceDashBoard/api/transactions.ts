import { VercelRequest, VercelResponse } from '@vercel/node';
import knex, { Knex } from 'knex';

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

// Helper function to parse and normalize dates
function normalizeDateString(dateInput: string | { startDate?: string, endDate?: string } | undefined): { startDate: string, endDate: string } {
  const defaultStartDate = '2023-01-01';
  const defaultEndDate = '2025-12-31';

  // If input is undefined, return default dates
  if (!dateInput) {
    return { startDate: defaultStartDate, endDate: defaultEndDate };
  }

  // If input is an object with startDate and endDate
  if (typeof dateInput === 'object' && 'startDate' in dateInput && 'endDate' in dateInput) {
    const startDate = dateInput.startDate ? new Date(dateInput.startDate) : new Date(defaultStartDate);
    const endDate = dateInput.endDate ? new Date(dateInput.endDate) : new Date(defaultEndDate);

    // Validate dates
    if (isNaN(startDate.getTime())) startDate.setTime(new Date(defaultStartDate).getTime());
    if (isNaN(endDate.getTime())) endDate.setTime(new Date(defaultEndDate).getTime());

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  // If input is a string
  if (typeof dateInput === 'string') {
    try {
      const date = new Date(dateInput);
      
      // If the date is invalid, return default dates
      if (isNaN(date.getTime())) {
        return { startDate: defaultStartDate, endDate: defaultEndDate };
      }
      
      // Return date in YYYY-MM-DD format
      return { 
        startDate: date.toISOString().split('T')[0], 
        endDate: date.toISOString().split('T')[0] 
      };
    } catch (error) {
      console.error('Date parsing error:', { dateInput, error });
      return { startDate: defaultStartDate, endDate: defaultEndDate };
    }
  }

  // Fallback to default dates
  return { startDate: defaultStartDate, endDate: defaultEndDate };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let db: Knex;
  try {
    // Get database connection
    db = getDbConnection();

    const { method, query, body } = req;

    switch (method) {
      case 'GET':
        // Get transactions with optional filtering
        const { startDate, endDate, categoryId: filterCategoryId, limit = 50, offset = 0, userId } = query;
        
        // Normalize dates
        const { startDate: normalizedStartDate, endDate: normalizedEndDate } = normalizeDateString({ startDate: startDate as string, endDate: endDate as string });

        console.log('Transaction Query Params:', {
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
          userId: userId || 'a22002ba-8d08-41d4-8c07-62784123244a',
          categoryId: filterCategoryId
        });
        
        let queryBuilder = db('transactions')
          .select(
            'transactions.*',
            'categories.name as category_name'
          )
          .leftJoin('categories', 'transactions.category_id', 'categories.id')
          .where('transactions.user_id', userId || 'a22002ba-8d08-41d4-8c07-62784123244a')
          .where('transactions.date', '>=', normalizedStartDate)
          .where('transactions.date', '<=', normalizedEndDate)
          .orderBy('transactions.date', 'desc')  // Most recent transactions first
          .orderBy('transactions.created_at', 'desc')  // Secondary sort by creation time
          .limit(Number(limit))
          .offset(Number(offset));

        if (filterCategoryId) {
          queryBuilder = queryBuilder.where('transactions.category_id', filterCategoryId);
        }

        const transactions = await queryBuilder;

        console.log('Transactions Found:', {
          count: transactions.length,
          firstTransaction: transactions[0],
          lastTransaction: transactions[transactions.length - 1]
        });

        res.status(200).json(transactions);
        break;
      
      case 'GET_DASHBOARD_SUMMARY':
        // Get dashboard summary
        const { startDate: summaryStartDate, endDate: summaryEndDate, userId: summaryUserId } = query;
        
        // Normalize dates
        const { startDate: normalizedSummaryStartDate, endDate: normalizedSummaryEndDate } = normalizeDateString({ startDate: summaryStartDate as string, endDate: summaryEndDate as string });

        console.log('Dashboard Summary Query Params:', {
          startDate: normalizedSummaryStartDate,
          endDate: normalizedSummaryEndDate,
          userId: summaryUserId || 'a22002ba-8d08-41d4-8c07-62784123244a'
        });

        // Calculate total income
        const incomeResult = await db('transactions')
          .where('user_id', summaryUserId || 'a22002ba-8d08-41d4-8c07-62784123244a')
          .where('type', 'income')
          .where('date', '>=', normalizedSummaryStartDate)
          .where('date', '<=', normalizedSummaryEndDate)
          .sum('amount as totalIncome')
          .first();

        // Calculate total expenses
        const expenseResult = await db('transactions')
          .where('user_id', summaryUserId || 'a22002ba-8d08-41d4-8c07-62784123244a')
          .where('type', 'expense')
          .where('date', '>=', normalizedSummaryStartDate)
          .where('date', '<=', normalizedSummaryEndDate)
          .sum('amount as totalExpense')
          .first();

        // Prepare summary
        const summary = {
          totalIncome: parseFloat(incomeResult?.totalIncome || '0'),
          totalExpense: parseFloat(expenseResult?.totalExpense || '0'),
          balance: parseFloat(incomeResult?.totalIncome || '0') - parseFloat(expenseResult?.totalExpense || '0')
        };

        console.log('Dashboard Summary:', summary);

        res.status(200).json(summary);
        break;
      
      case 'POST':
        // Create new transaction
        // Support both categoryId and category_id for backward compatibility
        const { amount, type, date, description, categoryId, category_id } = body;
        
        // Determine the category ID, prioritizing category_id over categoryId
        const finalCategoryId = category_id || categoryId;
        
        // Validate required fields
        if (!amount || !type || !date || !finalCategoryId) {
          console.error('Transaction creation failed: Missing required fields', { 
            amount, 
            type, 
            date, 
            categoryId: finalCategoryId 
          });
          return res.status(400).json({ 
            error: 'Missing required fields: amount, type, date, categoryId',
            details: {
              amount: !!amount,
              type: !!type,
              date: !!date,
              categoryId: !!finalCategoryId
            }
          });
        }

        // Validate amount
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          console.error('Transaction creation failed: Invalid amount', { amount });
          return res.status(400).json({ 
            error: 'Invalid amount. Must be a positive number.' 
          });
        }

        // Validate category exists
        const categoryExists = await db('categories')
          .where({ 
            id: finalCategoryId, 
            user_id: 'a22002ba-8d08-41d4-8c07-62784123244a' 
          })
          .first();

        if (!categoryExists) {
          console.error('Transaction creation failed: Category not found', { 
            categoryId: finalCategoryId 
          });
          return res.status(404).json({ 
            error: 'Category not found or unauthorized' 
          });
        }

        // Validate date format
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          console.error('Transaction creation failed: Invalid date', { date });
          return res.status(400).json({ 
            error: 'Invalid date format' 
          });
        }

        const [newTransaction] = await db('transactions')
          .insert({
            amount: parsedAmount,
            type,
            date: parsedDate.toISOString().split('T')[0], // Normalize date
            description: description || null,
            category_id: finalCategoryId,
            user_id: 'a22002ba-8d08-41d4-8c07-62784123244a' // TODO: Get from auth - using demo user for now
          })
          .returning('*');

        console.log('Transaction created successfully', { 
          transactionId: newTransaction.id, 
          amount: newTransaction.amount, 
          type: newTransaction.type 
        });

        res.status(201).json(newTransaction);
        break;
      
      case 'PUT':
        // Update transaction
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'Transaction ID is required' });
        }

        const updateData: any = {};
        if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
        if (body.type !== undefined) updateData.type = body.type;
        if (body.date !== undefined) updateData.date = body.date;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.categoryId !== undefined) updateData.category_id = body.categoryId;

        const [updatedTransaction] = await db('transactions')
          .where({ id })
          .update(updateData)
          .returning('*');

        if (!updatedTransaction) {
          return res.status(404).json({ error: 'Transaction not found' });
        }

        res.status(200).json(updatedTransaction);
        break;

      case 'DELETE':
        // Delete transaction
        const { id: deleteId } = req.query;
        if (!deleteId) {
          return res.status(400).json({ error: 'Transaction ID is required' });
        }

        const deletedCount = await db('transactions')
          .where({ id: deleteId })
          .del();

        if (deletedCount === 0) {
          return res.status(404).json({ error: 'Transaction not found' });
        }

        res.status(204).end();
        break;
      
      case 'GET_SPENDING_BY_CATEGORY':
        // Get spending by category
        const { startDate: spendStartDate, endDate: spendEndDate, userId: spendUserId } = query;
        
        // Normalize dates
        const { startDate: normalizedSpendStartDate, endDate: normalizedSpendEndDate } = normalizeDateString({ startDate: spendStartDate as string, endDate: spendEndDate as string });

        console.log('Spending by Category Query Params:', {
          startDate: normalizedSpendStartDate,
          endDate: normalizedSpendEndDate,
          userId: spendUserId || 'a22002ba-8d08-41d4-8c07-62784123244a'
        });

        const spendingByCategory = await db('transactions')
          .select('categories.name as category')
          .select(db.raw('SUM(amount) as total_amount'))
          .leftJoin('categories', 'transactions.category_id', 'categories.id')
          .where('transactions.user_id', spendUserId || 'a22002ba-8d08-41d4-8c07-62784123244a')
          .where('transactions.type', 'expense')
          .where('transactions.date', '>=', normalizedSpendStartDate)
          .where('transactions.date', '<=', normalizedSpendEndDate)
          .groupBy('categories.name')
          .orderBy('total_amount', 'desc');

        console.log('Spending by Category:', spendingByCategory);

        res.status(200).json(spendingByCategory);
        break;
      
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'GET_SPENDING_BY_CATEGORY', 'GET_DASHBOARD_SUMMARY']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    // Log full error details
    console.error('API Error:', {
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
}
