// Test songs route directly
const express = require('express');
const app = express();
const songsRouter = require('./routes/songs');

app.use('/api/songs', songsRouter);

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  
  // Test the route
  setTimeout(async () => {
    try {
      const response = await fetch(`http://localhost:${PORT}/api/songs?limit=2`);
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
      process.exit(0);
    } catch (error) {
      console.error('Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }, 1000);
});
