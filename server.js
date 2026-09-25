/**
 * Smart Expense Splitter - HTTP Server
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

const app = require('./app');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(`🚀 Smart Expense Splitter Server running`);
  console.log(`📡 Local URL:    http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment:  ${process.env.NODE_ENV || 'development'}`);
  console.log('====================================================');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
