FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl postgresql-client

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY . .

# Create required directories
RUN mkdir -p logs attached_assets

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

EXPOSE 5000

CMD ["node", "server.js"]