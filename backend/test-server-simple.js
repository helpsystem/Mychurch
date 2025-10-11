// Simple Test Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const bibleRoutes = require('./routes/bibleRoutes');
const aiChatRoutes = require('./routes/aiChatRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/bible', bibleRoutes);
app.use('/api/ai-chat', aiChatRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), ts: Date.now() });
});

app.get('/', (req, res) => {
  res.send('Bible AI Chat API - Simple Test Server');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test Server running on http://localhost:${PORT}`);
  console.log('📖 /api/bible/* - Bible routes');
  console.log('🤖 /api/ai-chat/* - AI Chat routes');
  console.log('❤️ /api/health - Health check');
});
