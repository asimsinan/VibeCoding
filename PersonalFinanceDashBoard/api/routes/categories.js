const express = require('express');
const router = express.Router();
const knex = require('../db');

// Get categories
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 'a22002ba-8d08-41d4-8c07-62784123244a';
    const categories = await knex('categories')
      .select('*')
      .where('user_id', userId)
      .orderBy('name', 'asc');
    
    res.json(categories);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
router.post('/', async (req, res) => {
  try {
    const { name, type } = req.body;
    const userId = 'a22002ba-8d08-41d4-8c07-62784123244a'; // Demo user

    const [newCategory] = await knex('categories')
      .insert({
        name,
        type,
        user_id: userId
      })
      .returning('*');

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Category creation error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = 'a22002ba-8d08-41d4-8c07-62784123244a'; // Demo user

    // Check if category exists and belongs to user
    const category = await knex('categories')
      .where({ id, user_id: userId })
      .first();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check for existing transactions
    const transactionCount = await knex('transactions')
      .where('category_id', id)
      .count('* as count')
      .first();

    if (Number(transactionCount.count) > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing transactions' });
    }

    // Delete category
    await knex('categories')
      .where({ id, user_id: userId })
      .del();

    res.status(204).end();
  } catch (error) {
    console.error('Category deletion error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
