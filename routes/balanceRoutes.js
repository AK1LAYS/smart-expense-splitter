/**
 * Smart Expense Splitter - Balance & Settlement Routes
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

const express = require('express');
const router = express.Router();
const BalanceController = require('../controllers/balanceController');

// GET /api/balances - Get net balance summary and optimized settlements
router.get('/balances', BalanceController.getBalances);

// GET /api/settlements/export - Export settlement transactions history
router.get('/settlements/export', BalanceController.exportSettlements);

module.exports = router;
