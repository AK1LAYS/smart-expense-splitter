/**
 * Smart Expense Splitter - Express Application Entrypoint
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./middleware/logger');
const { securityHeaders, rateLimiter } = require('./middleware/security');

// Route imports
const expenseRoutes = require('./routes/expenseRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');

const app = express();

// Security Settings & Headers
app.disable('x-powered-by');
app.use(securityHeaders);

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Rate Limiting for all /api routes
app.use('/api', rateLimiter);

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * GET /health
 * Service health status & runtime metadata probe
 * Required by Jenkins CI, Docker container healthcheck, and Render Cloud
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'smart-expense-splitter',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    commit: process.env.GIT_COMMIT || process.env.RENDER_GIT_COMMIT || 'local-build-v1.0'
  });
});

/**
 * GET /api/version
 * Public API Version Information
 */
app.get('/api/version', (req, res) => {
  res.json({
    version: "1.0.0",
    service: "Smart Expense Splitter API"
  });
});

// API Routes
app.use('/api', expenseRoutes);
app.use('/api', balanceRoutes);
app.use('/api', analyticsRoutes);
app.use('/api/workspace', workspaceRoutes);

// Fallback to index.html for SPA routes if not matched
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 Handler for API
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint '${req.originalUrl}' not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
