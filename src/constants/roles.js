/**
 * src/constants/roles.js
 * Centralized Role Constants and Helper Functions for QuickBite SSO
 */

export const ADMIN_ROLES = [
  'admin',
  'administrator',
  'superadmin',
  'system_admin',
  'quickbite-admin',
];

export const SUB_ADMIN_ROLES = [
  'sub-admin',
  'subadmin',
  'sub_admin',
  'quickbite-sub-admin',
];

export const MANAGER_ROLES = [
  'manager',
  'quickbite-manager',
];

export const MERCHANT_ROLES = [
  'merchant',
  'seller',
  'restaurant',
  'quickbite-merchant',
];

export const ADMIN_PORTAL_ROLES = [
  ...ADMIN_ROLES,
  ...SUB_ADMIN_ROLES,
  ...MANAGER_ROLES,
];

export const USER_MANAGEMENT_ROLES = [
  ...ADMIN_ROLES,
  ...SUB_ADMIN_ROLES,
];

export const SYSTEM_CONFIG_ROLES = [
  ...ADMIN_ROLES,
];

/**
 * Extract all role strings as an array of lowercase strings
 */
export function getUserRoles(user) {
  if (!user) return [];
  const rawRoles =
    user.roles && Array.isArray(user.roles) && user.roles.length > 0
      ? user.roles
      : user.role
      ? [user.role]
      : [];
  return rawRoles.map((r) => String(r).toLowerCase().trim()).filter(Boolean);
}

/**
 * Check if user's roles match any of the target roles
 */
export function hasRoleMatch(userRoles, targetRoles) {
  if (!userRoles || !targetRoles) return false;
  return targetRoles.some((target) =>
    userRoles.map((r) => r.toLowerCase()).includes(target.toLowerCase())
  );
}

/**
 * Map QuickBite SSO roles to ShorterLink local roles ('admin' | 'manager' | 'user')
 */
export function mapQuickBiteRoleToLocalRole(rawRoles) {
  const rolesList = Array.isArray(rawRoles)
    ? rawRoles
    : String(rawRoles || '').split(',');

  const normalized = rolesList
    .map((r) => String(r).toLowerCase().trim())
    .filter(Boolean);

  if (ADMIN_ROLES.some((target) => normalized.includes(target))) {
    return 'admin';
  }

  if (
    MANAGER_ROLES.some((target) => normalized.includes(target)) ||
    SUB_ADMIN_ROLES.some((target) => normalized.includes(target))
  ) {
    return 'manager';
  }

  return 'user';
}

export function canAccessAdminPortal(user) {
  return hasRoleMatch(getUserRoles(user), ADMIN_PORTAL_ROLES);
}

export function canManageUsers(user) {
  return hasRoleMatch(getUserRoles(user), USER_MANAGEMENT_ROLES);
}

export function canAccessSystemConfig(user) {
  return hasRoleMatch(getUserRoles(user), SYSTEM_CONFIG_ROLES);
}

export function isMerchant(user) {
  return hasRoleMatch(getUserRoles(user), MERCHANT_ROLES);
}
