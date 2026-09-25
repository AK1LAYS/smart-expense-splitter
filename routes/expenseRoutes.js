/**
 * Smart Expense Splitter - Expense & Member Routes
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

const express = require('express');
const router = express.Router();
const ExpenseController = require('../controllers/expenseController');
const { validateExpense, validateMember } = require('../middleware/validateExpense');

// Member Routes
router.get('/members', ExpenseController.getMembers);
router.post('/members', validateMember, ExpenseController.addMember);
router.delete('/members/:name', ExpenseController.deleteMember);

// Expense Routes
router.get('/expenses', ExpenseController.getAllExpenses);
router.get('/expenses/:id', ExpenseController.getExpenseById);
router.post('/expenses', validateExpense, ExpenseController.createExpense);
router.put('/expenses/:id', validateExpense, ExpenseController.updateExpense);
router.delete('/expenses/:id', ExpenseController.deleteExpense);

// Version Route
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
