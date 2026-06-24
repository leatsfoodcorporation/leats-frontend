"use client";

import { useAuth } from "./useAuth";

/**
 * Permission hook — check if current user has a specific permission
 * Admin → always returns true (full access)
 * Employee → checks role permissions
 * User/DeliveryPartner → always returns false
 *
 * Usage:
 *   const { canView, canAdd, canEdit, canDelete, hasPermission } = usePermissions();
 *   {canAdd('online_products') && <Button>Add Product</Button>}
 */
export const usePermissions = () => {
  const { user } = useAuth(false);

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;

    // Admin = always full access
    if (user.role === "admin") return true;

    // Employee = check permissions from role
    if (user.role === "employee") {
      const permissions = user.permissions || [];
      const modulePerm = permissions.find((p) => p.module === module);
      if (!modulePerm) return false;
      return Array.isArray(modulePerm.actions) && modulePerm.actions.includes(action);
    }

    // User / DeliveryPartner = no dashboard access
    return false;
  };

  const canView = (module: string) => hasPermission(module, "view");
  const canAdd = (module: string) => hasPermission(module, "add");
  const canEdit = (module: string) => hasPermission(module, "edit");
  const canDelete = (module: string) => hasPermission(module, "delete");

  // Check if user has ANY permission for a module (used for sidebar visibility)
  const hasModuleAccess = (module: string) => canView(module);

  // Check if user is admin (full bypass)
  const isFullAccess = () => user?.role === "admin";

  return {
    hasPermission,
    canView,
    canAdd,
    canEdit,
    canDelete,
    hasModuleAccess,
    isFullAccess,
  };
};
