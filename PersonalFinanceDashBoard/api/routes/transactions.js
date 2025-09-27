const express = require('express');
const router = express.Router();
const knex = require('../db');

// Get transactions
router.get('/', async (req, res) => {
  try {
    const { 
      startDate = '2023-01-01', 
      endDate = new Date().toISOString().split('T')[0], 
      userId = 'a22002ba-8d08-41d4-8c07-62784123244a',
      limit = 50,
      offset = 0
    } = req.query;

    const transactions = await knex('transactions')
      .select(
        'transactions.*',
        'categories.name as category_name'
      )
      .leftJoin('categories', 'transactions.category_id', 'categories.id')
      .where('transactions.user_id', userId)
      .where('transactions.date', '>=', startDate)
      .where('transactions.date', '<=', endDate)
      .orderBy('transactions.date', 'desc')
      .limit(Number(limit))
      .offset(Number(offset));

    res.json(transactions);
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create transaction
router.post('/', async (req, res) => {
  try {
    const { 
      amount, 
      type, 
      date, 
      description, 
      category_id: categoryId 
    } = req.body;
    const userId = 'a22002ba-8d08-41d4-8c07-62784123244a'; // Demo user

    // Validate input
    if (!amount || !type || !date || !categoryId) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, type, date, categoryId' 
      });
    }

    // Validate category
    const category = await knex('categories')
      .where({ id: categoryId, user_id: userId })
      .first();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const [newTransaction] = await knex('transactions')
      .insert({
        amount: parseFloat(amount),
        type,
        date,
        description: description || null,
        category_id: categoryId,
        user_id: userId
      })
      .returning('*');

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

module.exports = router;
