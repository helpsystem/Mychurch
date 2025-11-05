/**
 * Minimal Test Server
 * فقط برای تشخیص اینکه مشکل از کد Backend است یا سیستم
 */

const express = require('express');
const app = express();

console.log('\n🧪 Starting minimal test server...\n');

// یک endpoint ساده
app.get('/api/health', (req, res) => {
  console.log('✅ Health check request received at:', new Date().toLocaleString());
  res.json({
    status: 'ok',
    message: 'Minimal test server is running!',
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('<h1>✅ Minimal Test Server Running</h1><p>Try <a href="/api/health">/api/health</a></p>');
});

// Error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const PORT = 3002;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Minimal test server running on http://localhost:' + PORT);
  console.log('✅ Health check: http://localhost:' + PORT + '/api/health');
  console.log('\n⏰ Server started at:', new Date().toLocaleString());
  console.log('📊 Memory usage:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
  console.log('\n🔍 Monitoring for crashes...\n');
  
  // Log uptime every 5 seconds
  setInterval(() => {
    console.log('⏱️  Still running... Uptime:', Math.round(process.uptime()), 'seconds');
  }, 5000);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

console.log('🚀 Script execution completed. Server should be running...');
