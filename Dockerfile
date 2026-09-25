# ==============================================================================
# Smart Expense Splitter - Production Dockerfile
# MIT-WPU TY CSE CCD/AIES LCA-2
# Multi-stage optimized production image using Node.js 20 Alpine
# ==============================================================================

FROM node:20-alpine AS base

# Install curl for container health check
RUN apk add --no-cache curl

# Set working directory inside container
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Copy package manifests first for optimal Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev --no-audit --no-fund

# Copy the rest of the application source code
COPY . .

# Change ownership to the non-root 'node' user for security compliance
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose application port
EXPOSE 3000

# Health check configuration for Render and Docker
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application server
CMD ["npm", "start"]
