const { Pool } = require('pg');  // ✅ استفاده از PostgreSQL
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// برای پارس کردن JSON در فیلدهای permissions, profileData, invitations
const parseUser = (user) => {
  if (user) {
    try {
      // Handle permissions - could be JSON array or "all" string
      if (typeof user.permissions === 'string') {
        if (user.permissions === 'all') {
          user.permissions = ['all'];
        } else {
          user.permissions = JSON.parse(user.permissions || '[]');
        }
      } else if (!Array.isArray(user.permissions)) {
        user.permissions = [];
      }

      // Handle invitations
      if (typeof user.invitations === 'string') {
        user.invitations = JSON.parse(user.invitations || '[]');
      } else if (!Array.isArray(user.invitations)) {
        user.invitations = [];
      }

      // Handle profileData
      if (typeof user.profiledata === 'string' && user.profiledata) {
        user.profiledata = JSON.parse(user.profiledata);
      } else if (!user.profiledata || typeof user.profiledata !== 'object') {
        user.profiledata = {};
      }
    } catch (e) {
      console.error('Failed to parse user JSON fields:', e);
      user.permissions = [];
      user.invitations = [];
      user.profiledata = {};
    }
  }
  return user;
};

module.exports = { pool, parseUser };
