/**
 * ============================================================
 *  MyChurch RBAC Configuration
 *  Role-Based Access Control — Roles & Permissions Definitions
 * ============================================================
 *
 * This file is the SINGLE SOURCE OF TRUTH for all role and
 * permission definitions in the system.
 *
 * Architecture:
 *   - Each user can have MULTIPLE roles (stored in `roles` JSONB column)
 *   - Each role maps to a set of granular permissions
 *   - A user's effective permissions = union of all role permissions + custom permissions
 *   - SUPER_ADMIN has wildcard ('*') → bypasses all permission checks
 */

// ─── Role Constants ──────────────────────────────────────────
const ROLES = {
  USER: 'USER',
  LEADER: 'LEADER',
  WORSHIP_LEADER: 'WORSHIP_LEADER',
  MANAGER: 'MANAGER',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

// ─── All Valid Roles (for validation) ────────────────────────
const VALID_ROLES = Object.values(ROLES);

// ─── Role Hierarchy (higher number = more privilege) ─────────
const ROLE_HIERARCHY = {
  [ROLES.USER]: 1,
  [ROLES.LEADER]: 2,
  [ROLES.WORSHIP_LEADER]: 2,
  [ROLES.MANAGER]: 3,
  [ROLES.SUPER_ADMIN]: 4,
};

// ─── Permission Definitions ─────────────────────────────────
// Format: "resource:action"
const PERMISSIONS = {
  // ── Worship / Music ──
  WORSHIP_READ: 'worship:read',
  WORSHIP_EDIT: 'worship:edit',
  WORSHIP_DELETE: 'worship:delete',
  WORSHIP_MANAGE: 'worship:manage',       // full worship management

  // ── Bible ──
  BIBLE_READ: 'bible:read',
  BIBLE_EDIT: 'bible:edit',
  BIBLE_AUDIO: 'bible:audio',             // manage Bible audio/TTS

  // ── Broadcast ──
  BROADCAST_VIEW: 'broadcast:view',
  BROADCAST_CONTROL: 'broadcast:control', // control slides, camera, etc.
  BROADCAST_SETTINGS: 'broadcast:settings',
  BROADCAST_AI: 'broadcast:ai',           // AI features (live transcription)

  // ── Sermons ──
  SERMONS_READ: 'sermons:read',
  SERMONS_EDIT: 'sermons:edit',
  SERMONS_DELETE: 'sermons:delete',

  // ── Events ──
  EVENTS_READ: 'events:read',
  EVENTS_EDIT: 'events:edit',
  EVENTS_DELETE: 'events:delete',
  EVENTS_RECORD: 'events:record',

  // ── Users / Members ──
  USERS_READ: 'users:read',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_ROLES: 'users:roles',             // assign roles to others

  // ── Settings ──
  SETTINGS_READ: 'settings:read',
  SETTINGS_EDIT: 'settings:edit',

  // ── Files / Storage ──
  FILES_READ: 'files:read',
  FILES_UPLOAD: 'files:upload',
  FILES_DELETE: 'files:delete',

  // ── Pages / Content ──
  PAGES_READ: 'pages:read',
  PAGES_EDIT: 'pages:edit',

  // ── Announcements ──
  ANNOUNCEMENTS_READ: 'announcements:read',
  ANNOUNCEMENTS_EDIT: 'announcements:edit',

  // ── Daily Content ──
  DAILY_CONTENT_READ: 'daily_content:read',
  DAILY_CONTENT_EDIT: 'daily_content:edit',

  // ── Presentations ──
  PRESENTATIONS_READ: 'presentations:read',
  PRESENTATIONS_EDIT: 'presentations:edit',

  // ── Analytics ──
  ANALYTICS_VIEW: 'analytics:view',

  // ── Communications ──
  COMMUNICATIONS_READ: 'communications:read',
  COMMUNICATIONS_SEND: 'communications:send',

  // ── Galleries ──
  GALLERIES_READ: 'galleries:read',
  GALLERIES_EDIT: 'galleries:edit',

  // ── Prayer Requests ──
  PRAYER_READ: 'prayer:read',
  PRAYER_MANAGE: 'prayer:manage',

  // ── Letters ──
  LETTERS_READ: 'letters:read',
  LETTERS_EDIT: 'letters:edit',

  // ── Wildcard (SUPER_ADMIN only) ──
  ALL: '*',
};

// ─── Default Permissions per Role ────────────────────────────
// When a user has a role, they automatically get these permissions.
// Custom permissions from the `permissions` column are ADDED on top.
const ROLE_PERMISSIONS = {
  [ROLES.USER]: [
    PERMISSIONS.BIBLE_READ,
    PERMISSIONS.WORSHIP_READ,
    PERMISSIONS.SERMONS_READ,
    PERMISSIONS.EVENTS_READ,
    PERMISSIONS.PAGES_READ,
    PERMISSIONS.ANNOUNCEMENTS_READ,
    PERMISSIONS.DAILY_CONTENT_READ,
    PERMISSIONS.GALLERIES_READ,
    PERMISSIONS.PRAYER_READ,
    PERMISSIONS.LETTERS_READ,
    PERMISSIONS.PRESENTATIONS_READ,
    PERMISSIONS.FILES_READ,
    PERMISSIONS.COMMUNICATIONS_READ,
  ],

  [ROLES.LEADER]: [
    // Everything USER has, plus:
    PERMISSIONS.SERMONS_EDIT,
    PERMISSIONS.EVENTS_EDIT,
    PERMISSIONS.EVENTS_RECORD,
    PERMISSIONS.BROADCAST_VIEW,
    PERMISSIONS.ANNOUNCEMENTS_EDIT,
    PERMISSIONS.DAILY_CONTENT_EDIT,
    PERMISSIONS.LETTERS_EDIT,
    PERMISSIONS.PRAYER_MANAGE,
    PERMISSIONS.FILES_UPLOAD,
  ],

  [ROLES.WORSHIP_LEADER]: [
    // Everything USER has, plus:
    PERMISSIONS.WORSHIP_EDIT,
    PERMISSIONS.WORSHIP_MANAGE,
    PERMISSIONS.BROADCAST_VIEW,
    PERMISSIONS.BROADCAST_CONTROL,
    PERMISSIONS.BROADCAST_AI,
    PERMISSIONS.PRESENTATIONS_EDIT,
    PERMISSIONS.BIBLE_AUDIO,
    PERMISSIONS.FILES_UPLOAD,
  ],

  [ROLES.MANAGER]: [
    // Everything LEADER + WORSHIP_LEADER has, plus:
    PERMISSIONS.WORSHIP_DELETE,
    PERMISSIONS.SERMONS_DELETE,
    PERMISSIONS.EVENTS_DELETE,
    PERMISSIONS.BROADCAST_SETTINGS,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.FILES_DELETE,
    PERMISSIONS.PAGES_EDIT,
    PERMISSIONS.GALLERIES_EDIT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.COMMUNICATIONS_SEND,
    PERMISSIONS.BIBLE_EDIT,
    PERMISSIONS.DAILY_CONTENT_EDIT,
  ],

  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.ALL, // Wildcard — bypasses all checks
  ],
};

// ─── Helper Functions ────────────────────────────────────────

/**
 * Get all permissions for a list of roles (union).
 * Includes inherited permissions from lower roles in the hierarchy.
 * @param {string[]} roles - Array of role strings
 * @returns {string[]} - Deduplicated array of permission strings
 */
function getPermissionsForRoles(roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return [...ROLE_PERMISSIONS[ROLES.USER]];
  }

  const permSet = new Set();

  for (const role of roles) {
    // Add direct role permissions
    const directPerms = ROLE_PERMISSIONS[role];
    if (directPerms) {
      directPerms.forEach(p => permSet.add(p));
    }

    // Add inherited permissions from roles below in hierarchy
    const roleLevel = ROLE_HIERARCHY[role] || 0;
    for (const [inheritRole, inheritLevel] of Object.entries(ROLE_HIERARCHY)) {
      if (inheritLevel < roleLevel && ROLE_PERMISSIONS[inheritRole]) {
        ROLE_PERMISSIONS[inheritRole].forEach(p => permSet.add(p));
      }
    }
  }

  return [...permSet];
}

/**
 * Compute the effective permissions for a user.
 * = permissions from all roles + custom user permissions
 * @param {string[]} roles - User's roles array
 * @param {string[]} customPermissions - User's custom permissions from DB
 * @returns {string[]} - Final deduplicated permissions
 */
function computeEffectivePermissions(roles, customPermissions = []) {
  const rolePerms = getPermissionsForRoles(roles);
  const permSet = new Set([...rolePerms, ...customPermissions]);
  return [...permSet];
}

/**
 * Check if a set of permissions includes the required permission.
 * Handles wildcard ('*') permission.
 * @param {string[]} userPermissions - User's effective permissions
 * @param {string} requiredPermission - The permission to check
 * @returns {boolean}
 */
function hasPermission(userPermissions, requiredPermission) {
  if (!Array.isArray(userPermissions)) return false;
  if (userPermissions.includes(PERMISSIONS.ALL)) return true;
  if (userPermissions.includes('all')) return true; // legacy compat
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if a set of permissions includes ANY of the required permissions.
 * @param {string[]} userPermissions
 * @param {string[]} requiredPermissions
 * @returns {boolean}
 */
function hasAnyPermission(userPermissions, requiredPermissions) {
  return requiredPermissions.some(p => hasPermission(userPermissions, p));
}

/**
 * Check if a set of permissions includes ALL of the required permissions.
 * @param {string[]} userPermissions
 * @param {string[]} requiredPermissions
 * @returns {boolean}
 */
function hasAllPermissions(userPermissions, requiredPermissions) {
  return requiredPermissions.every(p => hasPermission(userPermissions, p));
}

/**
 * Determine the "primary" role from a roles array (highest hierarchy).
 * Used for backward compatibility where a single `role` string is needed.
 * @param {string[]} roles
 * @returns {string}
 */
function getPrimaryRole(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return ROLES.USER;
  return roles.reduce((highest, role) => {
    return (ROLE_HIERARCHY[role] || 0) > (ROLE_HIERARCHY[highest] || 0) ? role : highest;
  }, roles[0]);
}

/**
 * Check if a role string is valid.
 * @param {string} role
 * @returns {boolean}
 */
function isValidRole(role) {
  return VALID_ROLES.includes(role);
}

/**
 * Normalize roles input: accepts string or array, returns clean array.
 * @param {string|string[]} input
 * @returns {string[]}
 */
function normalizeRoles(input) {
  if (!input) return [ROLES.USER];
  if (typeof input === 'string') return [input];
  if (Array.isArray(input)) return input.filter(r => isValidRole(r));
  return [ROLES.USER];
}

module.exports = {
  ROLES,
  VALID_ROLES,
  ROLE_HIERARCHY,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getPermissionsForRoles,
  computeEffectivePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPrimaryRole,
  isValidRole,
  normalizeRoles,
};
