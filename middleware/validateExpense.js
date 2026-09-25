/**
 * Smart Expense Splitter - Request Validation Middleware
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

const ExpenseModel = require('../models/expenseModel');

const validateExpense = (req, res, next) => {
  const { description, amount, paidBy, splitType, participants, splitDetails } = req.body;
  const currentMembers = ExpenseModel.getMembers();

  // 1. Description validation
  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Expense description is required and cannot be empty'
    });
  }

  // 2. Amount validation
  const numAmount = parseFloat(amount);
  if (amount === undefined || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Expense amount must be a positive number greater than 0'
    });
  }

  // 3. PaidBy validation
  if (!paidBy || typeof paidBy !== 'string' || paidBy.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Payer name (paidBy) is required'
    });
  }

  // Check if paidBy exists in registered members
  const payerExists = currentMembers.some(
    m => m.toLowerCase() === paidBy.trim().toLowerCase()
  );
  if (!payerExists) {
    return res.status(400).json({
      success: false,
      error: `Payer '${paidBy}' is not a registered group member. Add member first.`
    });
  }

  // 4. Split Type validation
  const validSplitTypes = ['EQUAL', 'PERCENTAGE', 'CUSTOM'];
  if (!splitType || !validSplitTypes.includes(splitType.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid splitType. Must be one of: ${validSplitTypes.join(', ')}`
    });
  }

  // 5. Participants validation
  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Participants list is required and must contain at least one member'
    });
  }

  // Check for duplicate participants in request
  const uniqueParticipants = new Set(participants.map(p => p.toLowerCase().trim()));
  if (uniqueParticipants.size !== participants.length) {
    return res.status(400).json({
      success: false,
      error: 'Participants list cannot contain duplicates'
    });
  }

  // Check that all participants are registered members
  for (const p of participants) {
    const isMember = currentMembers.some(
      m => m.toLowerCase() === p.toLowerCase().trim()
    );
    if (!isMember) {
      return res.status(400).json({
        success: false,
        error: `Participant '${p}' is not a registered group member`
      });
    }
  }

  // 6. Percentage Split specific validation
  if (splitType.toUpperCase() === 'PERCENTAGE') {
    if (!splitDetails || typeof splitDetails !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Percentage split requires splitDetails object mapping participants to percentages'
      });
    }

    let sum = 0;
    for (const p of participants) {
      const pct = parseFloat(splitDetails[p]);
      if (pct === undefined || isNaN(pct) || pct < 0) {
        return res.status(400).json({
          success: false,
          error: `Participant '${p}' must have a non-negative percentage in splitDetails`
        });
      }
      sum += pct;
    }

    if (Math.abs(sum - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        error: `Percentage split total must equal exactly 100%. Current total: ${sum.toFixed(2)}%`
      });
    }
  }

  // 7. Custom Split specific validation
  if (splitType.toUpperCase() === 'CUSTOM') {
    if (!splitDetails || typeof splitDetails !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Custom split requires splitDetails object mapping participants to exact amounts'
      });
    }

    let sum = 0;
    for (const p of participants) {
      const share = parseFloat(splitDetails[p]);
      if (share === undefined || isNaN(share) || share < 0) {
        return res.status(400).json({
          success: false,
          error: `Participant '${p}' must have a non-negative custom amount in splitDetails`
        });
      }
      sum += Math.round(share * 100) / 100;
    }

    sum = Math.round(sum * 100) / 100;
    const roundedAmount = Math.round(numAmount * 100) / 100;

    if (Math.abs(sum - roundedAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        error: `Custom split sum (₹${sum.toFixed(2)}) must equal the total expense amount (₹${roundedAmount.toFixed(2)})`
      });
    }
  }

  next();
};

const validateMember = (req, res, next) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Member name is required and cannot be empty'
    });
  }

  const trimmed = name.trim();
  const currentMembers = ExpenseModel.getMembers();
  const exists = currentMembers.some(m => m.toLowerCase() === trimmed.toLowerCase());
  
  if (exists) {
    return res.status(400).json({
      success: false,
      error: `Member '${trimmed}' already exists in group`
    });
  }

  next();
};

module.exports = {
  validateExpense,
  validateMember
};
