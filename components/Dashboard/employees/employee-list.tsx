"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Eye, Pencil, Mail, Send, Loader2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { employeeService } from "@/services/employeeService";
import type { Employee, EmployeeStatus } from "@/types/employee";
import { usePermissions } from "@/hooks/usePermissions";

const STATUS_COLORS: Record<EmployeeStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  invited: "bg-blue-100 text-blue-700",
  verified: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
  inactive: "bg-gray-200 text-gray-500",
};

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, draft: 0, invited: 0, verified: 0, active: 0, suspended: 0, inactive: 0 });
  const { canAdd, canEdit } = usePermissions();
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: "invite" | "resend" | "delete"; employeeId: string; employeeName: string }>({ open: false, type: "invite", employeeId: "", employeeName: "" });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;

      const res = await employeeService.getEmployees(params);
      if (res.success) {
        setEmployees(res.data);
        setTotalPages(res.pagination.totalPages);
        setStats(res.stats);
      }
    } catch { toast.error("Failed to load employees"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmployees(); }, [page, statusFilter]);

  const handleSearch = () => { setPage(1); fetchEmployees(); };

  const handleConfirmAction = async () => {
    setActionLoading(true);
    try {
      if (confirmModal.type === "invite") {
        await employeeService.updateStatus(confirmModal.employeeId, { status: "invited" });
        toast.success("Invitation sent — employee ID generated & email sent");
      } else if (confirmModal.type === "resend") {
        await employeeService.resendInvitation(confirmModal.employeeId);
        toast.success("Invitation resent successfully");
      } else if (confirmModal.type === "delete") {
        await employeeService.deleteEmployee(confirmModal.employeeId);
        toast.success("Employee deactivated");
      }
      setConfirmModal({ open: false, type: "invite", employeeId: "", employeeName: "" });
      fetchEmployees();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr?.response?.data?.error || "Action failed");
    } finally { setActionLoading(false); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Employees</h1>
        {canAdd("employees") && (
          <Link href="/dashboard/employees/new">
            <Button><Plus className="w-4 h-4 mr-2" /> Add Employee</Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
        {(["draft", "invited", "verified", "active", "suspended", "inactive"] as EmployeeStatus[]).map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`p-2 sm:p-3 rounded-lg border text-center transition-colors ${statusFilter === s ? "border-[#e63946] bg-red-50" : "hover:bg-gray-50"}`}>
            <div className="text-lg sm:text-2xl font-bold">{stats[s]}</div>
            <div className="text-[10px] sm:text-xs text-gray-500 capitalize">{s}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="flex gap-2 flex-1">
          <Input placeholder="Search by name, email, ID..." value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()} />
          <Button onClick={handleSearch} size="sm"><Search className="w-4 h-4" /></Button>
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No employees found</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-medium">Employee</th>
              <th className="text-left p-3 font-medium hidden sm:table-cell">Email</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Role</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Department</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-xs text-gray-500">{emp.employeeId || "—"}</div>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-gray-500">{emp.email}</td>
                  <td className="p-3 hidden md:table-cell">{emp.role?.name || "—"}</td>
                  <td className="p-3 hidden lg:table-cell">{emp.department?.name || "—"}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[emp.status]}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/dashboard/employees/profile/${emp.id}`}>
                        <Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button>
                      </Link>
                      {canEdit("employees") && (
                        <Link href={`/dashboard/employees/edit/${emp.id}`}>
                          <Button size="sm" variant="ghost"><Pencil className="w-4 h-4" /></Button>
                        </Link>
                      )}
                      {canEdit("employees") && emp.status === "draft" && (
                        <Button size="sm" variant="ghost" className="text-blue-600" title="Send Invite"
                          onClick={() => setConfirmModal({ open: true, type: "invite", employeeId: emp.id, employeeName: emp.name })}>
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                      {canEdit("employees") && emp.status === "invited" && (
                        <Button size="sm" variant="ghost" className="text-orange-500" title="Resend Invite"
                          onClick={() => setConfirmModal({ open: true, type: "resend", employeeId: emp.id, employeeName: emp.name })}>
                          <Mail className="w-4 h-4" />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-gray-500">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Confirmation Modal */}
      <Dialog open={confirmModal.open} onOpenChange={(open) => !actionLoading && setConfirmModal(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmModal.type === "invite" && <><Send className="w-5 h-5 text-blue-600" /> Send Invitation</>}
              {confirmModal.type === "resend" && <><Mail className="w-5 h-5 text-orange-500" /> Resend Invitation</>}
              {confirmModal.type === "delete" && <><AlertTriangle className="w-5 h-5 text-red-500" /> Deactivate Employee</>}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {confirmModal.type === "invite" && (
                <>Are you sure you want to send an invitation to <strong>{confirmModal.employeeName}</strong>? An employee ID will be generated and an email with temporary credentials will be sent.</>
              )}
              {confirmModal.type === "resend" && (
                <>Resend invitation email to <strong>{confirmModal.employeeName}</strong>? A new temporary password will be generated.</>
              )}
              {confirmModal.type === "delete" && (
                <>Are you sure you want to deactivate <strong>{confirmModal.employeeName}</strong>? They will no longer be able to login.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" disabled={actionLoading} onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button
              disabled={actionLoading}
              onClick={handleConfirmAction}
              className={confirmModal.type === "delete" ? "bg-red-600 hover:bg-red-700" : confirmModal.type === "invite" ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-500 hover:bg-orange-600"}
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {confirmModal.type === "invite" && "Send Invite"}
              {confirmModal.type === "resend" && "Resend"}
              {confirmModal.type === "delete" && "Deactivate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
