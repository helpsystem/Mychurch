const express = require('express');
const cors = require('cors');
const userRoutes = require('./api/users');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON request bodies

// API Routes
app.get('/', (req, res) => {
    res.send('Welcome to the Church API!');
});
app.use('/api/users', userRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});