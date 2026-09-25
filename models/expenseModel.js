/**
 * Smart Expense Splitter - Data Model (In-Memory Store)
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

// Dynamic group members (starts with clean default, fully manageable by user)
let members = ['Alex', 'Sam', 'Jordan', 'Taylor'];

// In-memory expenses list
let expenses = [
  {
    id: 'exp-1',
    description: 'Team Dinner at Cafe',
    amount: 1200,
    paidBy: 'Alex',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    splitType: 'EQUAL',
    participants: ['Alex', 'Sam', 'Jordan', 'Taylor'],
    splits: {
      Alex: 300,
      Sam: 300,
      Jordan: 300,
      Taylor: 300
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'exp-2',
    description: 'Uber Ride to Hackathon',
    amount: 600,
    paidBy: 'Sam',
    category: 'Travel',
    date: new Date().toISOString().split('T')[0],
    splitType: 'PERCENTAGE',
    participants: ['Alex', 'Sam', 'Jordan'],
    splitDetails: {
      Alex: 50,
      Sam: 25,
      Jordan: 25
    },
    splits: {
      Alex: 300,
      Sam: 150,
      Jordan: 150
    },
    createdAt: new Date().toISOString()
  }
];

// Helper to generate unique ID
const generateId = () => {
  return 'exp-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
};

const ExpenseModel = {
  // Members Operations (Fully User-Manageable)
  getMembers: () => [...members],

  addMember: (name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      throw new Error('Member name cannot be empty');
    }
    const exists = members.some(m => m.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      throw new Error(`Member '${trimmed}' already exists`);
    }
    members.push(trimmed);
    return trimmed;
  },

  deleteMember: (name) => {
    const trimmed = (name || '').trim();
    const index = members.findIndex(m => m.toLowerCase() === trimmed.toLowerCase());
    if (index === -1) {
      throw new Error(`Member '${trimmed}' not found`);
    }
    
    // Remove member from members list
    members.splice(index, 1);

    // Clean up or remove participant references from active expenses to prevent orphaned calculations
    expenses.forEach(e => {
      if (e.participants && e.participants.includes(trimmed)) {
        e.participants = e.participants.filter(p => p.toLowerCase() !== trimmed.toLowerCase());
        if (e.splits && e.splits[trimmed] !== undefined) {
          delete e.splits[trimmed];
        }
        if (e.splitDetails && e.splitDetails[trimmed] !== undefined) {
          delete e.splitDetails[trimmed];
        }
      }
    });

    // Remove expenses where the deleted member was the sole payer and had no other participants
    expenses = expenses.filter(e => e.paidBy.toLowerCase() !== trimmed.toLowerCase() || e.participants.length > 0);

    return true;
  },

  clearAllMembers: () => {
    members = [];
    expenses = [];
    return true;
  },

  // Expenses Operations
  getAllExpenses: () => [...expenses],

  getExpenseById: (id) => {
    return expenses.find(e => e.id === id) || null;
  },

  createExpense: (expenseData) => {
    const newExpense = {
      id: generateId(),
      description: expenseData.description.trim(),
      amount: parseFloat(Number(expenseData.amount).toFixed(2)),
      paidBy: expenseData.paidBy.trim(),
      category: expenseData.category || 'General',
      date: expenseData.date || new Date().toISOString().split('T')[0],
      splitType: expenseData.splitType,
      participants: expenseData.participants,
      splitDetails: expenseData.splitDetails || null,
      splits: expenseData.splits,
      createdAt: new Date().toISOString()
    };
    expenses.unshift(newExpense);
    return newExpense;
  },

  updateExpense: (id, updateData) => {
    const index = expenses.findIndex(e => e.id === id);
    if (index === -1) return null;

    const existing = expenses[index];
    const updated = {
      ...existing,
      description: updateData.description !== undefined ? updateData.description.trim() : existing.description,
      amount: updateData.amount !== undefined ? parseFloat(Number(updateData.amount).toFixed(2)) : existing.amount,
      paidBy: updateData.paidBy !== undefined ? updateData.paidBy.trim() : existing.paidBy,
      category: updateData.category || existing.category,
      date: updateData.date || existing.date,
      splitType: updateData.splitType || existing.splitType,
      participants: updateData.participants || existing.participants,
      splitDetails: updateData.splitDetails !== undefined ? updateData.splitDetails : existing.splitDetails,
      splits: updateData.splits || existing.splits,
      updatedAt: new Date().toISOString()
    };

    expenses[index] = updated;
    return updated;
  },

  deleteExpense: (id) => {
    const index = expenses.findIndex(e => e.id === id);
    if (index === -1) return false;
    expenses.splice(index, 1);
    return true;
  },

  // Reset for unit testing
  _resetStore: (customMembers = ['Alex', 'Sam', 'Jordan', 'Taylor'], customExpenses = []) => {
    members = [...customMembers];
    expenses = [...customExpenses];
  }
};

module.exports = ExpenseModel;
