/**
 * Smart Expense Splitter - Analytics Controller
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

const ExpenseModel = require('../models/expenseModel');

const AnalyticsController = {
  // GET /api/analytics
  getAnalytics: (req, res) => {
    try {
      const expenses = ExpenseModel.getAllExpenses();
      const members = ExpenseModel.getMembers();

      // 1. Total Expense
      const totalExpense = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      // 2. This Month Expense
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed

      const thisMonthExpense = expenses.filter(e => {
        if (!e.date) return false;
        const expDate = new Date(e.date);
        return expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;
      }).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      // 3. Spender calculations (Highest Spender)
      const spendingByMember = {};
      members.forEach(m => { spendingByMember[m] = 0; });

      expenses.forEach(e => {
        const payer = e.paidBy;
        const amt = parseFloat(e.amount) || 0;
        if (spendingByMember[payer] !== undefined) {
          spendingByMember[payer] += amt;
        } else {
          spendingByMember[payer] = amt;
        }
      });

      let highestSpender = { member: 'None', amount: 0 };
      Object.entries(spendingByMember).forEach(([member, amount]) => {
        if (amount > highestSpender.amount) {
          highestSpender = { member, amount: Math.round(amount * 100) / 100 };
        }
      });

      // 4. Average Expense
      const averageExpense = expenses.length > 0 
        ? Math.round((totalExpense / expenses.length) * 100) / 100 
        : 0;

      const averagePerMember = members.length > 0
        ? Math.round((totalExpense / members.length) * 100) / 100
        : 0;

      // 5. Category Breakdown (for Chart.js Pie Chart)
      const categoryBreakdown = {};
      expenses.forEach(e => {
        const cat = e.category || 'General';
        const amt = parseFloat(e.amount) || 0;
        categoryBreakdown[cat] = Math.round(((categoryBreakdown[cat] || 0) + amt) * 100) / 100;
      });

      // 6. Split Type Breakdown
      const splitTypeBreakdown = {
        EQUAL: 0,
        PERCENTAGE: 0,
        CUSTOM: 0
      };
      expenses.forEach(e => {
        const type = (e.splitType || 'EQUAL').toUpperCase();
        if (splitTypeBreakdown[type] !== undefined) {
          splitTypeBreakdown[type]++;
        }
      });

      res.status(200).json({
        success: true,
        data: {
          totalExpense: Math.round(totalExpense * 100) / 100,
          thisMonthExpense: Math.round(thisMonthExpense * 100) / 100,
          highestSpender,
          averageExpense,
          averagePerMember,
          expensesCount: expenses.length,
          membersCount: members.length,
          categoryBreakdown,
          splitTypeBreakdown,
          spendingByMember
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to calculate analytics: ' + error.message
      });
    }
  },

  // GET /api/summary
  getSummary: (req, res) => {
    try {
      const expenses = ExpenseModel.getAllExpenses();
      const members = ExpenseModel.getMembers();

      const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      const totalMembers = members.length;

      res.status(200).json({
        success: true,
        summary: {
          totalExpenses: Math.round(totalExpenses * 100) / 100,
          totalMembers
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to calculate summary: ' + error.message
      });
    }
  }
};

module.exports = AnalyticsController;
