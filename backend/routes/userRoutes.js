const express = require('express');
const { pool, parseUser } = require('../db-postgres');
const { authenticateToken, authorizeRoles, authorizePermissions } = require('../middleware/auth');
const {
  ROLES,
  VALID_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  isValidRole,
  normalizeRoles,
  getPrimaryRole,
  computeEffectivePermissions,
  getPermissionsForRoles,
} = require('../config/roles');

const router = express.Router();

/**
 * Helper: enrich a user object with computed roles/permissions before sending.
 */
function enrichUser(user) {
  // Ensure roles array
  if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
    user.roles = [user.role || ROLES.USER];
  }
  user.role = getPrimaryRole(user.roles);
  user.permissions = computeEffectivePermissions(user.roles, user.permissions || []);
  return user;
}

// ─── GET /api/users ──────────────────────────────────────────
// List all users (MANAGER and SUPER_ADMIN)
router.get('/', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    const sanitizedUsers = result.rows.map(user => {
      const parsedUser = enrichUser(parseUser(user));
      delete parsedUser.password;
      return parsedUser;
    });
    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ─── PUT /api/users/:email/permissions ───────────────────────
// Update custom permissions for a user (SUPER_ADMIN only)
router.put('/:email/permissions', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { email } = req.params;
  const { permissions } = req.body;
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ message: 'Permissions must be an array.' });
  }
  try {
    const permissionsJSON = JSON.stringify(permissions);
    const result = await pool.query('UPDATE users SET permissions = $1 WHERE email = $2', [permissionsJSON, email]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Update Permissions Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ─── PUT /api/users/:email/role ──────────────────────────────
// Update primary role + sync roles array (SUPER_ADMIN only)
// Backward compatible: accepts { role: 'MANAGER' }
router.put('/:email/role', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { email } = req.params;
  const { role } = req.body;

  if (!role || !isValidRole(role)) {
    return res.status(400).json({ message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
  }

  try {
    // Get current user to merge roles
    const current = await pool.query('SELECT roles FROM users WHERE email = $1', [email]);
    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let currentRoles = current.rows[0].roles || [];
    if (!Array.isArray(currentRoles)) currentRoles = [];

    // Ensure the new role is in the roles array
    if (!currentRoles.includes(role)) {
      currentRoles.push(role);
    }

    const result = await pool.query(
      'UPDATE users SET role = $1, roles = $2 WHERE email = $3',
      [role, JSON.stringify(currentRoles), email]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ success: true, message: 'Role updated successfully', role, roles: currentRoles });
  } catch (error) {
    console.error('Update Role Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ─── PUT /api/users/:email/roles ─────────────────────────────
// NEW: Set the full roles array for a user (multi-role assignment)
// Body: { roles: ['LEADER', 'WORSHIP_LEADER'] }
router.put('/:email/roles', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { email } = req.params;
  const { roles } = req.body;

  if (!Array.isArray(roles) || roles.length === 0) {
    return res.status(400).json({ message: 'Roles must be a non-empty array.' });
  }

  // Validate all roles
  const invalidRoles = roles.filter(r => !isValidRole(r));
  if (invalidRoles.length > 0) {
    return res.status(400).json({
      message: `Invalid roles: ${invalidRoles.join(', ')}. Valid: ${VALID_ROLES.join(', ')}`,
    });
  }

  // Prevent removing SUPER_ADMIN from self
  if (req.user.email === email && !roles.includes(ROLES.SUPER_ADMIN)) {
    return res.status(400).json({ message: 'Cannot remove SUPER_ADMIN from your own account.' });
  }

  try {
    const primaryRole = getPrimaryRole(roles);
    const result = await pool.query(
      'UPDATE users SET role = $1, roles = $2 WHERE email = $3 RETURNING *',
      [primaryRole, JSON.stringify(roles), email]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updatedUser = enrichUser(parseUser(result.rows[0]));
    delete updatedUser.password;
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update Roles Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ─── POST /api/users ─────────────────────────────────────────
// Create a new user (SUPER_ADMIN only)
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { name, email, password, role = 'USER', roles: inputRoles, permissions = [] } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  // Determine roles array
  const roles = inputRoles && Array.isArray(inputRoles) ? inputRoles : [role];
  const invalidRoles = roles.filter(r => !isValidRole(r));
  if (invalidRoles.length > 0) {
    return res.status(400).json({ message: `Invalid roles: ${invalidRoles.join(', ')}` });
  }

  const primaryRole = getPrimaryRole(roles);

  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const profileData = JSON.stringify({
      name: name.trim(),
      billingInfo: {},
      creditCards: [],
      imageUrl: `https://i.pravatar.cc/150?u=${email.toLowerCase()}`
    });

    const result = await pool.query(
      `INSERT INTO users (email, password, role, roles, permissions, profileData, invitations, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, '[]', NOW()) RETURNING *`,
      [email.toLowerCase(), hashedPassword, primaryRole, JSON.stringify(roles), JSON.stringify(permissions), profileData]
    );

    const newUser = enrichUser(parseUser(result.rows[0]));
    delete newUser.password;
    res.status(201).json({ user: newUser });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ─── PUT /api/users/:email ───────────────────────────────────
// Update user details (SUPER_ADMIN, MANAGER)
router.put('/:email', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { email } = req.params;
  const updates = req.body;

  try {
    // Build dynamic update query
    const allowedFields = ['first_name', 'last_name', 'role', 'roles', 'permissions', 'profileData'];
    const updateParts = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateParts.push(`${key} = $${paramIndex}`);
        if (['permissions', 'roles', 'profileData'].includes(key)) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
        paramIndex++;
      }
    }

    // If roles are being updated, sync the primary role
    if (updates.roles && Array.isArray(updates.roles)) {
      const primaryRole = getPrimaryRole(updates.roles);
      updateParts.push(`role = $${paramIndex}`);
      values.push(primaryRole);
      paramIndex++;
    }

    if (updateParts.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update.' });
    }

    values.push(email);
    const query = `UPDATE users SET ${updateParts.join(', ')} WHERE email = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updatedUser = enrichUser(parseUser(result.rows[0]));
    delete updatedUser.password;
    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ─── GET /api/users/roles/definitions ────────────────────────
// NEW: Return available roles and their default permissions (public info for admin UI)
router.get('/roles/definitions', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  res.json({
    roles: VALID_ROLES,
    permissions: Object.values(PERMISSIONS),
    rolePermissions: ROLE_PERMISSIONS,
  });
});

module.exports = router;