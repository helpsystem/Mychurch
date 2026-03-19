const jwt = require('jsonwebtoken');
const {
  hasPermission,
  hasAnyPermission,
  normalizeRoles,
  ROLES,
} = require('../config/roles');

const { pool } = require('../db-postgres');
const { computeEffectivePermissions, getPrimaryRole } = require('../config/roles');

/**
 * Authenticate JWT token (Supabase Format).
 * Sets req.user with decoded payload plus local DB roles and permissions.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  // Use Supabase JWT Secret for verification
  const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'fallback-secret';
  
  jwt.verify(token, jwtSecret, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    
    // Supabase JWT puts email inside decoded.email and UUID in decoded.sub
    const email = decoded.email;
    
    if (!email) {
      return res.status(403).json({ message: 'Token missing email payload.' });
    }

    try {
      // Fetch local user to get custom roles and permissions
      const result = await pool.query('SELECT role, roles, permissions FROM users WHERE email = $1', [email]);
      
      let localRoles = ['USER'];
      let localPerms = [];
      let localPrimaryRole = 'USER';

      if (result.rows.length > 0) {
        const dbUser = result.rows[0];
        
        let parsedRoles = [];
        try {
           parsedRoles = typeof dbUser.roles === 'string' ? JSON.parse(dbUser.roles) : dbUser.roles;
        } catch (e) { }

        let parsedPerms = [];
        try {
           parsedPerms = typeof dbUser.permissions === 'string' ? JSON.parse(dbUser.permissions) : dbUser.permissions;
        } catch (e) { }

        if (Array.isArray(parsedRoles) && parsedRoles.length > 0) {
            localRoles = parsedRoles;
        } else if (dbUser.role) {
            localRoles = [dbUser.role];
        }

        localPrimaryRole = getPrimaryRole(localRoles);
        localPerms = computeEffectivePermissions(localRoles, Array.isArray(parsedPerms) ? parsedPerms : []);
      }

      req.user = {
        ...decoded,
        email: email,
        role: localPrimaryRole,
        roles: localRoles,
        permissions: localPerms
      };
      
      next();
    } catch (dbError) {
      console.error("Auth DB Error:", dbError);
      return res.status(500).json({ message: 'Internal server error verifying user.' });
    }
  });
};

/**
 * Authorize by role(s).
 * A user passes if ANY of their roles matches ANY of the allowed roles.
 * SUPER_ADMIN always passes.
 *
 * Usage: authorizeRoles('MANAGER', 'SUPER_ADMIN')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }

    // SUPER_ADMIN bypass
    const userRoles = normalizeRoles(req.user.roles || req.user.role);
    if (userRoles.includes(ROLES.SUPER_ADMIN)) {
      return next();
    }

    // Check if any of the user's roles match the allowed roles
    const hasMatchingRole = userRoles.some(r => allowedRoles.includes(r));
    if (!hasMatchingRole) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    next();
  };
};

/**
 * Authorize by permission(s) — ANY match passes.
 * Uses the permissions array from the JWT token.
 * SUPER_ADMIN (with '*' permission) always passes.
 *
 * Usage: authorizePermissions('worship:edit', 'worship:manage')
 */
const authorizePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }

    const userPerms = req.user.permissions || [];
    if (hasAnyPermission(userPerms, requiredPermissions)) {
      return next();
    }

    return res.status(403).json({
      message: 'You do not have the required permission.',
      required: requiredPermissions,
    });
  };
};

/**
 * Authorize by permission(s) — ALL must match.
 *
 * Usage: authorizeAllPermissions('users:read', 'users:edit')
 */
const authorizeAllPermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }

    const userPerms = req.user.permissions || [];

    // Wildcard check
    if (hasPermission(userPerms, '*')) {
      return next();
    }

    const missing = requiredPermissions.filter(p => !hasPermission(userPerms, p));
    if (missing.length > 0) {
      return res.status(403).json({
        message: 'You do not have all required permissions.',
        missing,
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizePermissions,
  authorizeAllPermissions,
};