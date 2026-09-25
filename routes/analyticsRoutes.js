/**
 * Smart Expense Splitter - Analytics Routes
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');

// GET /api/analytics - Get spending insights, highest spender, category breakdown
router.get('/analytics', AnalyticsController.getAnalytics);

// GET /api/summary - Get expense summary (totalExpenses, totalMembers)
router.get('/summary', AnalyticsController.getSummary);

// GET /api/categories - Get category-wise expense analytics
router.get('/categories', AnalyticsController.getCategories);

module.exports = router;
