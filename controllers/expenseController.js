/**
 * Smart Expense Splitter - Expense Controller
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

const ExpenseModel = require('../models/expenseModel');
const SplitCalculator = require('../services/splitCalculator');

const ExpenseController = {
  // GET /api/expenses
  getAllExpenses: (req, res) => {
    try {
      let expenses = ExpenseModel.getAllExpenses();
      const { search, category, splitType, member } = req.query;

      if (search) {
        const query = search.toLowerCase();
        expenses = expenses.filter(e =>
          e.description.toLowerCase().includes(query) ||
          e.paidBy.toLowerCase().includes(query) ||
          e.category.toLowerCase().includes(query)
        );
      }

      if (category && category !== 'ALL') {
        expenses = expenses.filter(e => e.category.toLowerCase() === category.toLowerCase());
      }

      if (splitType && splitType !== 'ALL') {
        expenses = expenses.filter(e => e.splitType.toUpperCase() === splitType.toUpperCase());
      }

      if (member) {
        expenses = expenses.filter(
          e => e.paidBy.toLowerCase() === member.toLowerCase() ||
               e.participants.some(p => p.toLowerCase() === member.toLowerCase())
        );
      }

      res.status(200).json({
        success: true,
        count: expenses.length,
        data: expenses
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve expenses: ' + error.message
      });
    }
  },

  // GET /api/expenses/:id
  getExpenseById: (req, res) => {
    try {
      const expense = ExpenseModel.getExpenseById(req.params.id);
      if (!expense) {
        return res.status(404).json({
          success: false,
          error: `Expense with ID '${req.params.id}' not found`
        });
      }

      res.status(200).json({
        success: true,
        data: expense
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // POST /api/expenses
  createExpense: (req, res) => {
    try {
      const { description, amount, paidBy, category, date, splitType, participants, splitDetails } = req.body;

      // Calculate splits
      const splits = SplitCalculator.calculateSplits(
        amount,
        splitType,
        participants,
        splitDetails
      );

      const newExpense = ExpenseModel.createExpense({
        description,
        amount,
        paidBy,
        category,
        date,
        splitType: splitType.toUpperCase(),
        participants,
        splitDetails,
        splits
      });

      res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        data: newExpense
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // PUT /api/expenses/:id
  updateExpense: (req, res) => {
    try {
      const existing = ExpenseModel.getExpenseById(req.params.id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: `Expense with ID '${req.params.id}' not found`
        });
      }

      const { description, amount, paidBy, category, date, splitType, participants, splitDetails } = req.body;

      const updatedSplitType = (splitType || existing.splitType).toUpperCase();
      const updatedParticipants = participants || existing.participants;
      const updatedAmount = amount !== undefined ? amount : existing.amount;
      const updatedSplitDetails = splitDetails !== undefined ? splitDetails : existing.splitDetails;

      const splits = SplitCalculator.calculateSplits(
        updatedAmount,
        updatedSplitType,
        updatedParticipants,
        updatedSplitDetails
      );

      const updatedExpense = ExpenseModel.updateExpense(req.params.id, {
        description,
        amount: updatedAmount,
        paidBy,
        category,
        date,
        splitType: updatedSplitType,
        participants: updatedParticipants,
        splitDetails: updatedSplitDetails,
        splits
      });

      res.status(200).json({
        success: true,
        message: 'Expense updated successfully',
        data: updatedExpense
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // DELETE /api/expenses/:id
  deleteExpense: (req, res) => {
    try {
      const deleted = ExpenseModel.deleteExpense(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: `Expense with ID '${req.params.id}' not found`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Expense deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/members
  getMembers: (req, res) => {
    try {
      const members = ExpenseModel.getMembers();
      res.status(200).json({
        success: true,
        count: members.length,
        data: members
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // POST /api/members
  addMember: (req, res) => {
    try {
      const { name } = req.body;
      const newMember = ExpenseModel.addMember(name);
      res.status(201).json({
        success: true,
        message: 'Member added successfully',
        data: newMember
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // DELETE /api/members/:name
  deleteMember: (req, res) => {
    try {
      const { name } = req.params;
      ExpenseModel.deleteMember(name);
      res.status(200).json({
        success: true,
        message: `Member '${name}' deleted successfully`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = ExpenseController;
