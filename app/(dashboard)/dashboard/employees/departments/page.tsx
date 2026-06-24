"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { departmentService } from "@/services/departmentService";
import type { Department } from "@/types/employee";
import { usePermissions } from "@/hooks/usePermissions";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteDept, setDeleteDept] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { canAdd, canEdit, canDelete } = usePermissions();

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await departmentService.getDepartments();
      if (res.success) setDepartments(res.data);
    } catch { toast.error("Failed to load departments"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      if (editingId) {
        await departmentService.updateDepartment(editingId, { name, description });
        toast.success("Department updated");
      } else {
        await departmentService.createDepartment({ name, description });
        toast.success("Department created");
      }
      setShowForm(false); setName(""); setDescription(""); setEditingId(null);
      fetchDepartments();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr?.response?.data?.error || "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDept) return;
    try {
      setDeleting(true);
      await departmentService.deleteDepartment(deleteDept.id);
      toast.success("Department deleted");
      setDeleteDept(null);
      fetchDepartments();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr?.response?.data?.error || "Failed to delete");
    } finally { setDeleting(false); }
  };

  const hasEmployees = (dept: Department) => (dept.employeeCount || 0) > 0;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Departments</h1>
        {canAdd("departments") && (
          <Button onClick={() => { setEditingId(null); setName(""); setDescription(""); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Department
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : departments.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No departments created yet</p>
      ) : (
        <div className="bg-white rounded-lg border">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Description</th>
              <th className="text-center p-3 font-medium">Employees</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {departments.map(dept => (
                <tr key={dept.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{dept.name}</td>
                  <td className="p-3 text-gray-500">{dept.description || "—"}</td>
                  <td className="p-3 text-center">{dept.employeeCount || 0}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${dept.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {dept.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      {canEdit("departments") && (
                        <Button size="sm" variant="ghost" onClick={() => { setEditingId(dept.id); setName(dept.name); setDescription(dept.description || ""); setShowForm(true); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete("departments") && (
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteDept(dept)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Department</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input placeholder="Department name" value={name} onChange={e => setName(e.target.value)} />
            <Input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteDept} onOpenChange={(open) => !open && setDeleteDept(null)}>
        <AlertContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDept && hasEmployees(deleteDept) ? (
                <span className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="w-5 h-5" />
                  Cannot Delete Department
                </span>
              ) : (
                "Delete Department?"
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDept && hasEmployees(deleteDept) ? (
                <span>
                  The department <strong>&quot;{deleteDept?.name}&quot;</strong> has{" "}
                  <strong>{deleteDept?.employeeCount} employee(s)</strong> assigned to it.
                  <br /><br />
                  First reassign or remove those employees from this department, then you can delete it.
                </span>
              ) : (
                <span>
                  Are you sure you want to delete the department <strong>&quot;{deleteDept?.name}&quot;</strong>?
                  This action cannot be undone.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {deleteDept && hasEmployees(deleteDept) ? "OK" : "Cancel"}
            </AlertDialogCancel>
            {deleteDept && !hasEmployees(deleteDept) && (
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Deleting...</> : "Delete"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertContent>
      </AlertDialog>
    </div>
  );
}
