/**
 * Smart Expense Splitter - API Integration Test Suite
 * MIT-WPU TY CSE CCD/AIES LCA-2
 * Tests: Jest + Supertest
 */

const request = require('supertest');
const app = require('../app');
const ExpenseModel = require('../models/expenseModel');

describe('Smart Expense Splitter - Comprehensive API Test Suite', () => {

  beforeEach(() => {
    // Reset in-memory store before each test for idempotency
    ExpenseModel._resetStore(
      ['Alice', 'Bob', 'Charlie', 'Diana'],
      [
        {
          id: 'exp-test-1',
          description: 'Team Lunch',
          amount: 800,
          paidBy: 'Alice',
          category: 'Food',
          date: '2026-09-20',
          splitType: 'EQUAL',
          participants: ['Alice', 'Bob', 'Charlie', 'Diana'],
          splits: { Alice: 200, Bob: 200, Charlie: 200, Diana: 200 },
          createdAt: new Date().toISOString()
        }
      ]
    );
  });

  // Test 1: Health Endpoint Check
  describe('GET /health', () => {
    it('1. should return 200 OK with health status UP and service metadata', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'UP');
      expect(res.body).toHaveProperty('service', 'smart-expense-splitter');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  // Test 1b: Version Endpoint Check
  describe('GET /api/version', () => {
    it('1b. should return version and service name', async () => {
      const res = await request(app).get('/api/version');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        version: '1.0.0',
        service: 'Smart Expense Splitter API'
      });
    });
  });

  // Test 2: Member Management & Validation
  describe('Member Management APIs', () => {
    it('2. should fetch all members and allow adding a new valid member', async () => {
      // Fetch members
      const listRes = await request(app).get('/api/members');
      expect(listRes.statusCode).toBe(200);
      expect(listRes.body.data).toContain('Alice');

      // Add new member
      const addRes = await request(app)
        .post('/api/members')
        .send({ name: 'Eve' });
      expect(addRes.statusCode).toBe(201);
      expect(addRes.body.data).toBe('Eve');

      // Duplicate member check
      const dupRes = await request(app)
        .post('/api/members')
        .send({ name: 'Eve' });
      expect(dupRes.statusCode).toBe(400);
      expect(dupRes.body.error).toMatch(/already exists/i);
    });
  });

  // Test 3: Fetch all expenses
  describe('GET /api/expenses', () => {
    it('3. should retrieve expense list with correct count and structure', async () => {
      const res = await request(app).get('/api/expenses');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].description).toBe('Team Lunch');
    });
  });

  // Test 4: Create Expense with EQUAL Split
  describe('POST /api/expenses (Equal Split)', () => {
    it('4. should successfully create an expense with EQUAL split', async () => {
      const payload = {
        description: 'Movie Tickets',
        amount: 600,
        paidBy: 'Bob',
        category: 'Stay',
        date: '2026-09-22',
        splitType: 'EQUAL',
        participants: ['Alice', 'Bob', 'Charlie']
      };

      const res = await request(app)
        .post('/api/expenses')
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(600);
      expect(res.body.data.splits.Alice).toBe(200);
      expect(res.body.data.splits.Bob).toBe(200);
      expect(res.body.data.splits.Charlie).toBe(200);
    });
  });

  // Test 5: Create Expense with PERCENTAGE Split
  describe('POST /api/expenses (Percentage Split)', () => {
    it('5. should calculate percentage split correctly when total is 100%', async () => {
      const payload = {
        description: 'Grocery Shopping',
        amount: 1000,
        paidBy: 'Charlie',
        category: 'Food',
        date: '2026-09-23',
        splitType: 'PERCENTAGE',
        participants: ['Alice', 'Bob'],
        splitDetails: {
          Alice: 60,
          Bob: 40
        }
      };

      const res = await request(app)
        .post('/api/expenses')
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.splits.Alice).toBe(600);
      expect(res.body.data.splits.Bob).toBe(400);
    });
  });

  // Test 6: Create Expense with CUSTOM Split
  describe('POST /api/expenses (Custom Split)', () => {
    it('6. should validate and create custom split when sum matches total amount', async () => {
      const payload = {
        description: 'Flight Booking',
        amount: 2500,
        paidBy: 'Alice',
        category: 'Travel',
        date: '2026-09-24',
        splitType: 'CUSTOM',
        participants: ['Alice', 'Bob', 'Charlie'],
        splitDetails: {
          Alice: 1000,
          Bob: 1000,
          Charlie: 500
        }
      };

      const res = await request(app)
        .post('/api/expenses')
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.splits.Alice).toBe(1000);
      expect(res.body.data.splits.Bob).toBe(1000);
      expect(res.body.data.splits.Charlie).toBe(500);
    });
  });

  // Test 7: Validation Error Handling
  describe('Validation and Bad Request Handling', () => {
    it('7. should reject negative amount, invalid payer, and mismatched split sums', async () => {
      // Negative amount
      const negRes = await request(app)
        .post('/api/expenses')
        .send({
          description: 'Invalid Exp',
          amount: -50,
          paidBy: 'Alice',
          splitType: 'EQUAL',
          participants: ['Alice', 'Bob']
        });
      expect(negRes.statusCode).toBe(400);

      // Non-existent payer
      const payerRes = await request(app)
        .post('/api/expenses')
        .send({
          description: 'Ghost Payer',
          amount: 100,
          paidBy: 'NonExistentPerson',
          splitType: 'EQUAL',
          participants: ['Alice', 'Bob']
        });
      expect(payerRes.statusCode).toBe(400);

      // Percentage sum != 100%
      const pctRes = await request(app)
        .post('/api/expenses')
        .send({
          description: 'Bad Pct',
          amount: 500,
          paidBy: 'Alice',
          splitType: 'PERCENTAGE',
          participants: ['Alice', 'Bob'],
          splitDetails: { Alice: 50, Bob: 30 } // sum = 80
        });
      expect(pctRes.statusCode).toBe(400);
      expect(pctRes.body.error).toMatch(/must equal exactly 100%/i);

      // Custom split sum mismatch
      const customRes = await request(app)
        .post('/api/expenses')
        .send({
          description: 'Bad Custom',
          amount: 1000,
          paidBy: 'Alice',
          splitType: 'CUSTOM',
          participants: ['Alice', 'Bob'],
          splitDetails: { Alice: 400, Bob: 400 } // sum = 800 != 1000
        });
      expect(customRes.statusCode).toBe(400);
      expect(customRes.body.error).toMatch(/must equal the total expense amount/i);
    });
  });

  // Test 8: Update and Delete Expense
  describe('PUT & DELETE /api/expenses/:id', () => {
    it('8. should update an existing expense and allow subsequent deletion', async () => {
      // Update
      const updateRes = await request(app)
        .put('/api/expenses/exp-test-1')
        .send({
          description: 'Updated Team Lunch at Cafe',
          amount: 1000,
          paidBy: 'Alice',
          category: 'Food',
          splitType: 'EQUAL',
          participants: ['Alice', 'Bob']
        });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.description).toBe('Updated Team Lunch at Cafe');
      expect(updateRes.body.data.amount).toBe(1000);
      expect(updateRes.body.data.splits.Alice).toBe(500);

      // Delete
      const delRes = await request(app).delete('/api/expenses/exp-test-1');
      expect(delRes.statusCode).toBe(200);

      // Verify 404 after deletion
      const fetchAgain = await request(app).get('/api/expenses/exp-test-1');
      expect(fetchAgain.statusCode).toBe(404);
    });
  });

  // Test 9: Balances & Smart Settlement Optimizer
  describe('GET /api/balances', () => {
    it('9. should return accurate member net balances and optimized settlement paths', async () => {
      // Add a second expense: Bob paid ₹400 for Alice and Bob (₹200 each)
      await request(app)
        .post('/api/expenses')
        .send({
          description: 'Cab fare',
          amount: 400,
          paidBy: 'Bob',
          category: 'Travel',
          splitType: 'EQUAL',
          participants: ['Alice', 'Bob']
        });

      const res = await request(app).get('/api/balances');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('memberBalances');
      expect(res.body.data).toHaveProperty('settlements');
      expect(Array.isArray(res.body.data.settlements)).toBe(true);

      // Settlements should contain valid transfers
      if (res.body.data.settlements.length > 0) {
        expect(res.body.data.settlements[0]).toHaveProperty('from');
        expect(res.body.data.settlements[0]).toHaveProperty('to');
        expect(res.body.data.settlements[0]).toHaveProperty('amount');
      }
    });

    it('9b. should export settlements list with timestamp via /api/settlements/export', async () => {
      const res = await request(app).get('/api/settlements/export');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('exportedAt');
      expect(Array.isArray(res.body.settlements)).toBe(true);
      if (res.body.settlements.length > 0) {
        expect(res.body.settlements[0]).toHaveProperty('from');
        expect(res.body.settlements[0]).toHaveProperty('to');
        expect(res.body.settlements[0]).toHaveProperty('amount');
      }
    });
  });

  // Test 10: Analytics Endpoint Check
  describe('GET /api/analytics', () => {
    it('10. should return dashboard cards data, highest spender, and category breakdown', async () => {
      const res = await request(app).get('/api/analytics');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalExpense', 800);
      expect(res.body.data).toHaveProperty('highestSpender');
      expect(res.body.data.highestSpender.member).toBe('Alice');
      expect(res.body.data).toHaveProperty('averageExpense');
      expect(res.body.data).toHaveProperty('categoryBreakdown');
      expect(res.body.data.categoryBreakdown.Food).toBe(800);
    });
  });

  // Test 10b: Expense Summary Endpoint Check
  describe('GET /api/summary', () => {
    it('10b. should return totalExpenses sum and totalMembers count', async () => {
      const res = await request(app).get('/api/summary');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        success: true,
        summary: {
          totalExpenses: 800,
          totalMembers: 4
        }
      });
    });
  });

  // Test 10c: Expense Categories Endpoint Check
  describe('GET /api/categories', () => {
    it('10c. should return category-wise expense breakdown list', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories).toEqual([
        {
          category: 'Food',
          amount: 800
        }
      ]);
    });
  });

  // Test 11: 404 Route handling
  describe('404 Route Handling', () => {
    it('11. should return 404 JSON for unknown API paths', async () => {
      const res = await request(app).get('/api/non-existent-endpoint');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // Test 12: Workspace & Room APIs (Multi-Device Isolation)
  describe('Workspace & Room APIs', () => {
    it('12. should create a new private workspace and return room ID with token', async () => {
      const res = await request(app)
        .post('/api/workspace/create')
        .send({
          name: 'Goa Trip 2026',
          yourName: 'Alex',
          passcode: '1234'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('roomId');
      expect(res.body.data).toHaveProperty('passcode', '1234');
      expect(res.body.data).toHaveProperty('token');
    });

    it('13. should allow joining an existing workspace with correct room ID and passcode', async () => {
      const createRes = await request(app)
        .post('/api/workspace/create')
        .send({
          name: 'Flat 402',
          yourName: 'Sam',
          passcode: '9999'
        });
      const roomId = createRes.body.data.roomId;

      // Join with correct passcode
      const joinRes = await request(app)
        .post('/api/workspace/join')
        .send({
          roomId,
          passcode: '9999',
          yourName: 'Jordan'
        });
      expect(joinRes.statusCode).toBe(200);
      expect(joinRes.body.success).toBe(true);
      expect(joinRes.body.data.members).toContain('Jordan');

      // Join with wrong passcode
      const failRes = await request(app)
        .post('/api/workspace/join')
        .send({
          roomId,
          passcode: '0000',
          yourName: 'Hacker'
        });
      expect(failRes.statusCode).toBe(401);
    });
  });

});

