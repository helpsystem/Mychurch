const jwt = require('jsonwebtoken');
const {
  hasPermission,
  hasAnyPermission,
  normalizeRoles,
  ROLES,
} = require('../config/roles');

/**
 * Authenticate JWT token.
 * Sets req.user with decoded payload (email, role, roles, permissions, name).
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    // Ensure roles array is always available (backward compat with old tokens)
    if (!decoded.roles && decoded.role) {
      decoded.roles = [decoded.role];
    }
    if (!decoded.permissions) {
      decoded.permissions = [];
    }
    req.user = decoded;
    next();
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