import { VercelRequest, VercelResponse } from '@vercel/node';
import knex from 'knex';

// Database connection
const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10 }
});

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

  try {
    const { method, query } = req;

    if (method === 'GET') {
      const { startDate, endDate } = query;
      
      // Default to current year if no dates provided
      const currentYear = new Date().getFullYear();
      const start = startDate || `${currentYear}-01-01`;
      const end = endDate || `${currentYear}-12-31`;

      // Get total income and expenses
      const [incomeResult] = await db('transactions')
        .where('type', 'income')
        .whereBetween('date', [start, end])
        .sum('amount as total');

      const [expenseResult] = await db('transactions')
        .where('type', 'expense')
        .whereBetween('date', [start, end])
        .sum('amount as total');

      const totalIncome = parseFloat(incomeResult?.total || '0');
      const totalExpense = parseFloat(expenseResult?.total || '0');
      const balance = totalIncome - totalExpense;

      // Get spending by category
      const spendingByCategory = await db('transactions')
        .select('categories.name', db.raw('SUM(transactions.amount) as amount'))
        .leftJoin('categories', 'transactions.category_id', 'categories.id')
        .where('transactions.type', 'expense')
        .whereBetween('transactions.date', [start, end])
        .groupBy('categories.name')
        .orderBy('amount', 'desc');

      // Get monthly trend data
      const monthlyTrend = await db('transactions')
        .select(
          db.raw('EXTRACT(MONTH FROM date) as month'),
          db.raw('EXTRACT(YEAR FROM date) as year'),
          'type',
          db.raw('SUM(amount) as total')
        )
        .whereBetween('date', [start, end])
        .groupBy('month', 'year', 'type')
        .orderBy('year', 'asc')
        .orderBy('month', 'asc');

      // Format monthly trend data
      const monthlyData = {};
      monthlyTrend.forEach(item => {
        const monthKey = `${item.year}-${String(item.month).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthKey, income: 0, expenses: 0 };
        }
        if (item.type === 'income') {
          monthlyData[monthKey].income = parseFloat(item.total);
        } else {
          monthlyData[monthKey].expenses = parseFloat(item.total);
        }
      });

      const dashboardData = {
        totalIncome,
        totalExpense,
        balance,
        spendingByCategory: spendingByCategory.map(item => ({
          name: item.name || 'Uncategorized',
          amount: parseFloat(item.amount)
        })),
        monthlyTrend: Object.values(monthlyData)
      };
      
      res.status(200).json(dashboardData);
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // Close database connection
    await db.destroy();
  }
}
