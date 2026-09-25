/**
 * Smart Expense Splitter - Expense & Member Routes
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

const express = require('express');
const router = express.Router();
const ExpenseController = require('../controllers/expenseController');
const { validateExpense, validateMember } = require('../middleware/validateExpense');

/**
 * @route   GET /api/members
 * @desc    Retrieve all registered group members
 * @access  Public
 */
router.get('/members', ExpenseController.getMembers);

/**
 * @route   POST /api/members
 * @desc    Add a new member to the group
 * @access  Public
 */
router.post('/members', validateMember, ExpenseController.addMember);

/**
 * @route   DELETE /api/members/:name
 * @desc    Remove a member from the group
 * @access  Public
 */
router.delete('/members/:name', ExpenseController.deleteMember);

/**
 * @route   GET /api/expenses
 * @desc    Retrieve all expenses with optional search, category, and splitType filters
 * @access  Public
 */
router.get('/expenses', ExpenseController.getAllExpenses);

/**
 * @route   GET /api/expenses/:id
 * @desc    Get detailed record of a single expense by ID
 * @access  Public
 */
router.get('/expenses/:id', ExpenseController.getExpenseById);

/**
 * @route   POST /api/expenses
 * @desc    Create and split a new expense (Equal, Percentage, Custom)
 * @access  Public
 */
router.post('/expenses', validateExpense, ExpenseController.createExpense);

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update an existing expense and recalculate member splits
 * @access  Public
 */
router.put('/expenses/:id', validateExpense, ExpenseController.updateExpense);

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete an expense by ID
 * @access  Public
 */
router.delete('/expenses/:id', ExpenseController.deleteExpense);

/**
 * @route   GET /api/version
 * @desc    API service name and version identifier
 * @access  Public
 */
router.get('/version', (req, res) => {
  res.json({
    version: "1.0.0",
    service: "Smart Expense Splitter API"
  });
});
router.get('/api/version', (req, res) => {
  res.json({
    version: "1.0.0",
    service: "Smart Expense Splitter API"
  });
});

module.exports = router;
