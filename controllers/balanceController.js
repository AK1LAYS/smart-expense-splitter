/**
 * Smart Expense Splitter - Balance Controller
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

const ExpenseModel = require('../models/expenseModel');
const SettlementService = require('../services/settlementService');

const BalanceController = {
  // GET /api/balances
  getBalances: (req, res) => {
    try {
      const members = ExpenseModel.getMembers();
      const expenses = ExpenseModel.getAllExpenses();

      const { balances, memberSummary } = SettlementService.calculateNetBalances(members, expenses);
      const settlements = SettlementService.optimizeSettlements(balances);

      const totalGroupExpense = expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

      res.status(200).json({
        success: true,
        data: {
          totalGroupExpense: Math.round(totalGroupExpense * 100) / 100,
          membersCount: members.length,
          memberBalances: memberSummary,
          settlements: settlements,
          settlementCount: settlements.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to calculate balances: ' + error.message
      });
    }
  },

  // GET /api/settlements/export
  exportSettlements: (req, res) => {
    try {
      const members = ExpenseModel.getMembers();
      const expenses = ExpenseModel.getAllExpenses();

      const { balances } = SettlementService.calculateNetBalances(members, expenses);
      const optimized = SettlementService.optimizeSettlements(balances);

      const settlements = (optimized || []).map(s => ({
        from: s.from,
        to: s.to,
        amount: s.amount
      }));

      res.status(200).json({
        success: true,
        exportedAt: new Date().toISOString(),
        settlements
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to export settlements: ' + error.message
      });
    }
  }
};

module.exports = BalanceController;
