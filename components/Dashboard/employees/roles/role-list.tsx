"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Shield, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { roleService } from "@/services/roleService";
import type { Role } from "@/types/employee";
import { usePermissions } from "@/hooks/usePermissions";

export default function RoleList() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { canAdd, canEdit, canDelete } = usePermissions();

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await roleService.getRoles();
      if (res.success) setRoles(res.data);
    } catch { toast.error("Failed to load roles"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteRole) return;
    try {
      setDeleting(true);
      await roleService.deleteRole(deleteRole.id);
      toast.success("Role deleted");
      setDeleteRole(null);
      fetchRoles();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr?.response?.data?.error || "Failed to delete");
    } finally { setDeleting(false); }
  };

  const hasEmployees = (role: Role) => (role.employeeCount || 0) > 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6" /> Roles & Permissions</h1>
        {canAdd("roles") && (
          <Link href="/dashboard/employees/roles/new">
            <Button><Plus className="w-4 h-4 mr-2" /> Create Role</Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : roles.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No roles created yet</p>
      ) : (
        <div className="grid gap-4">
          {roles.map(role => (
            <div key={role.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{role.name}</h3>
                  {role.isSystemRole && <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-100 text-yellow-700 font-medium">System</span>}
                </div>
                <p className="text-sm text-gray-500 mt-1">{role.description || "No description"}</p>
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                  <span>{role.permissionCount || 0} permissions</span>
                  <span>{role.employeeCount || 0} employees</span>
                </div>
              </div>
              <div className="flex gap-1">
                {canEdit("roles") && !role.isSystemRole && (
                  <Link href={`/dashboard/employees/roles/edit/${role.id}`}>
                    <Button size="sm" variant="ghost"><Pencil className="w-4 h-4" /></Button>
                  </Link>
                )}
                {canDelete("roles") && !role.isSystemRole && (
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteRole(role)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteRole} onOpenChange={(open) => !open && setDeleteRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteRole && hasEmployees(deleteRole) ? (
                <span className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="w-5 h-5" />
                  Cannot Delete Role
                </span>
              ) : (
                "Delete Role?"
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteRole && hasEmployees(deleteRole) ? (
                <span>
                  The role <strong>&quot;{deleteRole?.name}&quot;</strong> has{" "}
                  <strong>{deleteRole?.employeeCount} employee(s)</strong> assigned to it.
                  <br /><br />
                  First reassign or remove those employees, then you can delete this role.
                </span>
              ) : (
                <span>
                  Are you sure you want to delete the role <strong>&quot;{deleteRole?.name}&quot;</strong>?
                  This action cannot be undone.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {deleteRole && hasEmployees(deleteRole) ? "OK" : "Cancel"}
            </AlertDialogCancel>
            {deleteRole && !hasEmployees(deleteRole) && (
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Deleting...</> : "Delete Role"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
