/**
 * Smart Expense Splitter - Balance & Settlement Routes
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

const express = require('express');
const router = express.Router();
const BalanceController = require('../controllers/balanceController');

/**
 * @route   GET /api/balances
 * @desc    Get member net balances and greedy min-cash-flow settlement paths
 * @access  Public
 */
router.get('/balances', BalanceController.getBalances);

/**
 * @route   GET /api/settlements/export
 * @desc    Export settlement transaction history with ISO server timestamp
 * @access  Public
 */
router.get('/settlements/export', BalanceController.exportSettlements);

module.exports = router;
