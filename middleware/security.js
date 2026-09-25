/**
 * Smart Expense Splitter - Production Security & Rate Limiting Middleware
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

// In-memory request tracking map for IP rate limiting
const requestCounts = new Map();

// Configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 300; // 300 requests per IP per window

/**
 * Clean up expired rate limit tracking entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.startTime > RATE_LIMIT_WINDOW_MS) {
      requestCounts.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS).unref();

/**
 * Security Headers Middleware
 * Adds standard defensive HTTP headers without external npm dependencies
 */
const securityHeaders = (req, res, next) => {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Protect against clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Cross-site scripting (XSS) filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Control referrer information sent in HTTP headers
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Restrict sensitive browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
};

/**
 * IP Rate Limiter Middleware
 * Protects /api/* endpoints against denial-of-service and brute-force traffic
 */
const rateLimiter = (req, res, next) => {
  // Allow health check and test mode to bypass strict limits if needed
  if (req.path === '/health') {
    return next();
  }

  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();

  const record = requestCounts.get(clientIp);

  if (!record) {
    requestCounts.set(clientIp, {
      count: 1,
      startTime: now
    });
    return next();
  }

  // Check if window has elapsed
  if (now - record.startTime > RATE_LIMIT_WINDOW_MS) {
    record.count = 1;
    record.startTime = now;
    return next();
  }

  // Increment count
  record.count += 1;

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    res.setHeader('Retry-After', Math.ceil((RATE_LIMIT_WINDOW_MS - (now - record.startTime)) / 1000));
    return res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.'
    });
  }

  next();
};

module.exports = {
  securityHeaders,
  rateLimiter,
  _requestCounts: requestCounts // Exported for unit testing
};
