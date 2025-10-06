FROM node:18-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy health check script
COPY docker/health/healthcheck.js ./
COPY package*.json ./
RUN npm install --only=production

# Create logs directory
RUN mkdir -p /logs

CMD ["node", "healthcheck.js"]