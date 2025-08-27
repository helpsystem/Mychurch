const express = require('express');
const { pool, parseUser } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Middleware to apply to all routes in this file
router.use(authenticateToken);

// Helper function to get a user and their parsed profile data
const getUserProfile = async (email) => {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return null;
    return parseUser(users[0]);
};

// PUT /api/profile/billing - Update a single billing info field
router.put('/billing', async (req, res) => {
    try {
        let user = await getUserProfile(req.user.email);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Merge new billing info with existing
        const newBillingInfo = { ...user.profileData.billingInfo, ...req.body };
        user.profileData.billingInfo = newBillingInfo;

        await pool.query('UPDATE users SET profileData = ? WHERE email = ?', [JSON.stringify(user.profileData), req.user.email]);
        
        delete user.password;
        res.json({ user });
    } catch (error) {
        console.error('Update Billing Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// DELETE /api/profile/billing/:field - Delete a billing info field
router.delete('/billing/:field', async (req, res) => {
    const { field } = req.params;
    try {
        let user = await getUserProfile(req.user.email);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.profileData.billingInfo && field in user.profileData.billingInfo) {
            user.profileData.billingInfo[field] = ""; // Set to empty string instead of deleting
        }

        await pool.query('UPDATE users SET profileData = ? WHERE email = ?', [JSON.stringify(user.profileData), req.user.email]);
        
        delete user.password;
        res.json({ user });
    } catch (error) {
        console.error('Delete Billing Field Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// POST /api/profile/cards - Add a new credit card
router.post('/cards', async (req, res) => {
    const newCard = req.body;
    try {
        let user = await getUserProfile(req.user.email);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.profileData.creditCards.push(newCard);
        
        await pool.query('UPDATE users SET profileData = ? WHERE email = ?', [JSON.stringify(user.profileData), req.user.email]);

        delete user.password;
        res.json({ user });
    } catch (error) {
        console.error('Add Card Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// DELETE /api/profile/cards/:cardNumber - Delete a credit card
router.delete('/cards/:cardNumber', async (req, res) => {
    const { cardNumber } = req.params;
    try {
        let user = await getUserProfile(req.user.email);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.profileData.creditCards = user.profileData.creditCards.filter(card => card.number !== cardNumber);

        await pool.query('UPDATE users SET profileData = ? WHERE email = ?', [JSON.stringify(user.profileData), req.user.email]);
        
        delete user.password;
        res.json({ user });
    } catch (error) {
        console.error('Delete Card Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;