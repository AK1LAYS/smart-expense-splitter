/**
 * Smart Expense Splitter - Analytics Routes
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');

/**
 * @route   GET /api/analytics
 * @desc    Get dashboard spending insights, highest spender, category breakdown & split types
 * @access  Public
 */
router.get('/analytics', AnalyticsController.getAnalytics);

/**
 * @route   GET /api/summary
 * @desc    Get high-level summary metrics (totalExpenses, totalMembers)
 * @access  Public
 */
router.get('/summary', AnalyticsController.getSummary);

/**
 * @route   GET /api/categories
 * @desc    Get category-wise expense aggregation list for charts and reporting
 * @access  Public
 */
router.get('/categories', AnalyticsController.getCategories);

module.exports = router;
