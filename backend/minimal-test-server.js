/**
 * Absolute Minimal Server for Testing
 */

require('dotenv').config();
const express = require('express');

const app = express();
const PORT = 3001;

// Minimal middleware
app.use(express.json());

// Test route
app.get('/api/health', (req, res) => {
  console.log('✅ Health endpoint hit');
  res.json({ ok: true, message: 'Server is running' });
});

// Start server
app.listen(PORT, 'localhost', () => {
  console.log(`✅ Minimal server running on http://localhost:${PORT}`);
  console.log(`📍 Server bound to localhost:${PORT}`);
});

// Error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});
