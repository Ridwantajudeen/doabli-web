export const ADMIN_LEVELS = {
  support_admin: 1,
  finance_admin: 2,
  super_admin: 3,
  admin: 3,
};

export const getAdminLevel = (role) => ADMIN_LEVELS[role] || 0;
export const isAdminRole = (role) => getAdminLevel(role) > 0;
export const hasAdminLevel = (role, minLevel) => getAdminLevel(role) >= minLevel;

export const isSupportAdmin = (role) => getAdminLevel(role) >= 1;
export const isFinanceAdmin = (role) => getAdminLevel(role) >= 2;
export const isSuperAdmin = (role) => getAdminLevel(role) >= 3;
