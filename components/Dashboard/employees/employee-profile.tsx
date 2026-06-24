"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Mail, Loader2, Shield, Building, Calendar, Phone, MapPin, FileText, ExternalLink, User } from "lucide-react";
import { employeeService } from "@/services/employeeService";
import { roleService } from "@/services/roleService";
import type { Employee, Role } from "@/types/employee";
import { usePermissions } from "@/hooks/usePermissions";

interface EmployeeProfileProps {
  employeeId: string;
}

export default function EmployeeProfile({ employeeId }: EmployeeProfileProps) {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [saving, setSaving] = useState(false);
  const { canEdit } = usePermissions();

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const [empRes, rolesRes] = await Promise.all([
        employeeService.getEmployeeById(employeeId),
        roleService.getRoles({ isActive: "true" }),
      ]);
      if (empRes.success) setEmployee(empRes.data);
      if (rolesRes.success) setRoles(rolesRes.data);
    } catch { toast.error("Failed to load employee"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmployee(); }, [employeeId]);

  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    setSaving(true);
    try {
      await employeeService.updateStatus(employeeId, {
        status: selectedStatus,
        suspensionReason: selectedStatus === "suspended" ? suspensionReason : undefined,
      });
      toast.success(`Status changed to ${selectedStatus}`);
      setShowStatusModal(false);
      fetchEmployee();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to change status");
    } finally { setSaving(false); }
  };

  const handleRoleAssign = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      await employeeService.assignRole(employeeId, selectedRoleId);
      toast.success("Role assigned");
      setShowRoleModal(false);
      fetchEmployee();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to assign role");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!employee) return <div className="text-center py-12 text-gray-500">Employee not found</div>;

  const statusTransitions: Record<string, string[]> = {
    draft: ["invited"], invited: ["draft"], verified: ["active", "suspended"],
    active: ["suspended", "inactive"], suspended: ["active"], inactive: ["active"],
  };
  const allowedStatuses = statusTransitions[employee.status] || [];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">{employee.name}</h1>
          <p className="text-sm text-gray-500">{employee.employeeId || "Draft — No ID yet"}</p>
        </div>
        {canEdit("employees") && (
          <div className="flex gap-2">
            <Link href={`/dashboard/employees/edit/${employee.id}`}>
              <Button variant="outline" size="sm"><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
            </Link>
            {employee.status === "invited" && (
              <Button variant="outline" size="sm" onClick={async () => { await employeeService.resendInvitation(employee.id); toast.success("Invitation resent"); }}>
                <Mail className="w-4 h-4 mr-1" /> Resend
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><Phone className="w-4 h-4" /> Contact</h3>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-500">Email:</span> {employee.email}</p>
            <p><span className="text-gray-500">Phone:</span> {employee.phone}</p>
            <p><span className="text-gray-500">Gender:</span> {employee.gender || "—"}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> Role & Status</h3>
          <div className="text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${employee.status === "active" ? "bg-green-100 text-green-700" : employee.status === "suspended" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                {employee.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Role:</span>
              <span className="font-medium">{employee.role?.name || "No role"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Department:</span>
              <span>{employee.department?.name || "—"}</span>
            </div>
          </div>
          {canEdit("employees") && (
            <div className="flex gap-2 pt-2">
              {allowedStatuses.length > 0 && (
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowStatusModal(true)}>Change Status</Button>
              )}
              <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedRoleId(employee.roleId || ""); setShowRoleModal(true); }}>
                Assign Role
              </Button>
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4" /> Address</h3>
          <div className="text-sm space-y-1">
            <p>{employee.address || "—"}</p>
            <p>{[employee.city, employee.state, employee.pincode].filter(Boolean).join(", ") || "—"}</p>
            <p>{employee.country || "—"}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" /> Timeline</h3>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-500">Joined:</span> {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "—"}</p>
            <p><span className="text-gray-500">Last Login:</span> {employee.lastLogin ? new Date(employee.lastLogin).toLocaleString() : "Never"}</p>
            <p><span className="text-gray-500">Email Verified:</span> {employee.isEmailVerified ? "Yes" : "No"}</p>
          </div>
        </div>
      </div>

      {/* Status History */}
      {employee.statusHistory && employee.statusHistory.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Status History</h3>
          <div className="space-y-2">
            {employee.statusHistory.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span className="text-gray-500">{new Date(entry.changedAt).toLocaleString()}</span>
                <span>{entry.from || "—"} → <strong>{entry.to}</strong></span>
                <span className="text-gray-400 text-xs">{entry.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents & Identity */}
      {(employee.aadharNumber || employee.panNumber || employee.profilePhotoUrl || employee.aadharDocumentUrl || employee.panDocumentUrl || employee.idProofDocumentUrl) && (
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Documents</h3>

          {/* Identity Numbers */}
          {(employee.aadharNumber || employee.panNumber) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {employee.aadharNumber && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Aadhar Number</p>
                  <p className="font-mono font-medium text-sm">{employee.aadharNumber.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3")}</p>
                </div>
              )}
              {employee.panNumber && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">PAN Number</p>
                  <p className="font-mono font-medium text-sm">{employee.panNumber}</p>
                </div>
              )}
            </div>
          )}

          {/* Document Files */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {employee.profilePhotoUrl && (
              <a href={employee.profilePhotoUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <User className="w-6 h-6 text-blue-500" />
                <span className="text-xs text-center">Profile Photo</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            )}
            {employee.aadharDocumentUrl && (
              <a href={employee.aadharDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <FileText className="w-6 h-6 text-green-500" />
                <span className="text-xs text-center">Aadhar Doc</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            )}
            {employee.panDocumentUrl && (
              <a href={employee.panDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <FileText className="w-6 h-6 text-orange-500" />
                <span className="text-xs text-center">PAN Doc</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            )}
            {employee.idProofDocumentUrl && (
              <a href={employee.idProofDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <FileText className="w-6 h-6 text-purple-500" />
                <span className="text-xs text-center">ID Proof</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change Status</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger><SelectValue placeholder="Select new status" /></SelectTrigger>
              <SelectContent>
                {allowedStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {selectedStatus === "suspended" && (
              <div><Label>Reason</Label><Input value={suspensionReason} onChange={e => setSuspensionReason(e.target.value)} placeholder="Suspension reason" /></div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowStatusModal(false)}>Cancel</Button>
              <Button onClick={handleStatusChange} disabled={saving || !selectedStatus}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Assign Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Role</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}{r.isSystemRole ? " (System)" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRoleModal(false)}>Cancel</Button>
              <Button onClick={handleRoleAssign} disabled={saving || !selectedRoleId}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
