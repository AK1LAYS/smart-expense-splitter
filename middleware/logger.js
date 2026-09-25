/**
 * Smart Expense Splitter - HTTP Request Logger Middleware
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

const logger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const color = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';
    
    // Only log in non-test environments or when DEBUG is set
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${timestamp}] ${req.method} ${req.originalUrl} ${color}${statusCode}${reset} - ${duration}ms`);
    }
  });

  next();
};

module.exports = logger;
