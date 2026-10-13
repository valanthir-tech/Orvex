/**
 * Role-Based Access Control (RBAC) System for Onedexo ERP
 */

export type UserRole = 'Owner' | 'Manager' | 'Cashier' | 'Accountant' | 'Viewer';

export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'submit' | 'export';

export interface ModulePermission {
  allowedRoles: UserRole[];
  canSubmit?: UserRole[];
  canExport?: UserRole[];
  canViewCostPrice?: UserRole[];
}

export const ROLE_PERMISSIONS: Record<string, ModulePermission> = {
  pos: {
    allowedRoles: ['Owner', 'Manager', 'Cashier'],
    canSubmit: ['Owner', 'Manager', 'Cashier'],
  },
  sales: {
    allowedRoles: ['Owner', 'Manager', 'Cashier', 'Accountant', 'Viewer'],
    canSubmit: ['Owner', 'Manager', 'Accountant'],
    canExport: ['Owner', 'Manager', 'Accountant'],
    canViewCostPrice: ['Owner', 'Manager', 'Accountant'],
  },
  purchases: {
    allowedRoles: ['Owner', 'Manager', 'Accountant'],
    canSubmit: ['Owner', 'Manager', 'Accountant'],
    canExport: ['Owner', 'Manager', 'Accountant'],
    canViewCostPrice: ['Owner', 'Manager', 'Accountant'],
  },
  inventory: {
    allowedRoles: ['Owner', 'Manager', 'Accountant'],
    canSubmit: ['Owner', 'Manager'],
    canExport: ['Owner', 'Manager', 'Accountant'],
    canViewCostPrice: ['Owner', 'Manager'],
  },
  accounting: {
    allowedRoles: ['Owner', 'Manager', 'Accountant'],
    canSubmit: ['Owner', 'Accountant'],
    canExport: ['Owner', 'Accountant'],
  },
  store: {
    allowedRoles: ['Owner', 'Manager'],
    canSubmit: ['Owner', 'Manager'],
    canExport: ['Owner', 'Manager'],
  },
  reports: {
    allowedRoles: ['Owner', 'Manager', 'Accountant'],
    canExport: ['Owner', 'Manager', 'Accountant'],
  },
  settings: {
    allowedRoles: ['Owner', 'Manager'],
    canSubmit: ['Owner'],
  },
};

export function hasPermission(
  role: UserRole,
  module: string,
  action: ActionType | 'view_cost_price' = 'read'
): boolean {
  const perm = ROLE_PERMISSIONS[module];
  if (!perm) return false;

  if (action === 'read') {
    return perm.allowedRoles.includes(role);
  }
  if (action === 'submit') {
    return (perm.canSubmit || perm.allowedRoles).includes(role);
  }
  if (action === 'export') {
    return (perm.canExport || perm.allowedRoles).includes(role);
  }
  if (action === 'view_cost_price') {
    return (perm.canViewCostPrice || []).includes(role);
  }
  return perm.allowedRoles.includes(role);
}
