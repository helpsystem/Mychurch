const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`📥 Request: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, message: 'Raw HTTP server works!' }));
});

server.listen(3002, 'localhost', () => {
  console.log('✅ Raw HTTP server running on http://localhost:3002');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});
