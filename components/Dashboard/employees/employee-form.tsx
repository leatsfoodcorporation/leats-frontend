"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle, XCircle, ExternalLink, Trash2, Upload } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountryStateCitySelect } from "@/components/ui/country-state-city-select";
import { employeeService } from "@/services/employeeService";
import { roleService } from "@/services/roleService";
import { departmentService } from "@/services/departmentService";
import type { Role, Department } from "@/types/employee";
import axiosInstance from "@/lib/axios";

interface EmployeeFormProps {
  employeeId?: string; // If provided = edit mode
}

export default function EmployeeForm({ employeeId }: EmployeeFormProps) {
  const router = useRouter();
  const isEdit = !!employeeId;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", roleId: "", departmentId: "",
    dateOfBirth: "", gender: "", address: "", city: "", state: "",
    pincode: "", country: "India", aadharNumber: "", panNumber: "", joiningDate: "",
  });

  const [files, setFiles] = useState<Record<string, File | null>>({
    profilePhoto: null, aadharDocument: null, panDocument: null, idProofDocument: null,
  });

  // Track existing uploaded document URLs (for edit mode)
  const [existingDocs, setExistingDocs] = useState<Record<string, string>>({});

  const [emailStatus, setEmailStatus] = useState<{ checking: boolean; available?: boolean; isExistingUser?: boolean; message?: string }>({ checking: false });

  // Auto-fill from existing user when email is entered
  const checkEmailAndAutoFill = async (email: string) => {
    if (!email || !email.includes("@")) { setEmailStatus({ checking: false }); return; }
    setEmailStatus({ checking: true });
    try {
      const res = await axiosInstance.get("/api/employees/check-email", { params: { email } });
      const data = res.data;
      setEmailStatus({ checking: false, available: data.available, isExistingUser: data.isExistingUser, message: data.message });
      if (data.available && data.isExistingUser && data.userData) {
        setForm(f => ({
          ...f,
          name: data.userData.name || f.name,
          phone: data.userData.phone || f.phone,
          address: data.userData.address || f.address,
          city: data.userData.city || f.city,
          state: data.userData.state || f.state,
          pincode: data.userData.pincode || f.pincode,
          country: data.userData.country || f.country,
          dateOfBirth: data.userData.dateOfBirth ? data.userData.dateOfBirth.split("T")[0] : f.dateOfBirth,
        }));
        toast.success("Existing customer found — data auto-filled");
      }
    } catch { setEmailStatus({ checking: false }); }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rolesRes, deptRes] = await Promise.all([
          roleService.getRoles({ isActive: "true" }),
          departmentService.getDepartments({ isActive: "true" }),
        ]);
        if (rolesRes.success) setRoles(rolesRes.data);
        if (deptRes.success) setDepartments(deptRes.data);

        if (isEdit) {
          const empRes = await employeeService.getEmployeeById(employeeId);
          if (empRes.success) {
            const e = empRes.data;
            setForm({
              name: e.name, email: e.email, phone: e.phone,
              roleId: e.roleId || "", departmentId: e.departmentId || "",
              dateOfBirth: e.dateOfBirth ? e.dateOfBirth.split("T")[0] : "",
              gender: e.gender || "", address: e.address || "", city: e.city || "",
              state: e.state || "", pincode: e.pincode || "", country: e.country || "India",
              aadharNumber: e.aadharNumber || "", panNumber: e.panNumber || "",
              joiningDate: e.joiningDate ? e.joiningDate.split("T")[0] : "",
            });
            // Store existing document URLs
            const docs: Record<string, string> = {};
            if (e.profilePhotoUrl) docs.profilePhoto = e.profilePhotoUrl;
            if (e.aadharDocumentUrl) docs.aadharDocument = e.aadharDocumentUrl;
            if (e.panDocumentUrl) docs.panDocument = e.panDocumentUrl;
            if (e.idProofDocumentUrl) docs.idProofDocument = e.idProofDocumentUrl;
            setExistingDocs(docs);
          }
        }
      } catch { toast.error("Failed to load data"); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [employeeId, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast.error("Name, email, and phone are required");
      return;
    }

    // Aadhar validation — exactly 12 digits
    if (form.aadharNumber && !/^\d{12}$/.test(form.aadharNumber)) {
      toast.error("Aadhar number must be exactly 12 digits");
      return;
    }

    // PAN validation — format: ABCDE1234F (5 letters + 4 digits + 1 letter)
    if (form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panNumber.toUpperCase())) {
      toast.error("PAN number must be in format ABCDE1234F");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => { if (value) formData.append(key, value); });
      Object.entries(files).forEach(([key, file]) => { if (file) formData.append(key, file); });

      if (isEdit) {
        await employeeService.updateEmployee(employeeId, formData);
        toast.success("Employee updated");
      } else {
        await employeeService.createEmployee(formData);
        toast.success("Employee created as draft");
      }
      router.push("/dashboard/employees");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-xl sm:text-2xl font-bold">{isEdit ? "Edit Employee" : "Add New Employee"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="bg-white rounded-lg border p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-lg">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email with auto-fill */}
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                onBlur={e => !isEdit && checkEmailAndAutoFill(e.target.value)}
                required disabled={isEdit} placeholder="employee@example.com" />
              {emailStatus.checking && <p className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checking...</p>}
              {emailStatus.available === false && <p className="text-xs text-red-500 flex items-center gap-1"><XCircle className="w-3 h-3" /> {emailStatus.message}</p>}
              {emailStatus.isExistingUser && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {emailStatus.message}</p>}
              {emailStatus.available && !emailStatus.isExistingUser && emailStatus.message && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {emailStatus.message}</p>}
            </div>
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Full name" /></div>
            {/* Phone with country code */}
            <div className="space-y-1">
              <Label>Phone *</Label>
              <PhoneInput
                id="employee-phone"
                country={form.country}
                value={form.phone}
                onChange={(value) => setForm(f => ({ ...f, phone: value || "" }))}
              />
            </div>
            <div><Label>Gender</Label>
              <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} /></div>
            <div><Label>Joining Date</Label><Input type="date" value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} /></div>
          </div>
        </div>

        {/* Role & Department */}
        <div className="bg-white rounded-lg border p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-lg">Role & Department</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Role</Label>
              <Select value={form.roleId} onValueChange={v => setForm(f => ({ ...f, roleId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Department</Label>
              <Select value={form.departmentId} onValueChange={v => setForm(f => ({ ...f, departmentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-lg border p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-lg">Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street address, building name" /></div>
            {/* Country / State / City selector */}
            <div className="sm:col-span-2">
              <CountryStateCitySelect
                key={`loc-${form.country}-${form.state}-${form.city}`}
                value={{ country: form.country, state: form.state, city: form.city }}
                onChange={(value) => setForm(f => ({ ...f, country: value.country, state: value.state, city: value.city }))}
              />
            </div>
            <div><Label>Pincode</Label><Input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="e.g., 625001" /></div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-lg border p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-lg">Documents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Aadhar Number</Label><Input value={form.aadharNumber} maxLength={12} placeholder="123456789012" onChange={e => { const v = e.target.value.replace(/\D/g, ""); setForm(f => ({ ...f, aadharNumber: v })); }} />{form.aadharNumber && form.aadharNumber.length !== 12 && <p className="text-xs text-red-500 mt-1">Must be 12 digits ({form.aadharNumber.length}/12)</p>}</div>
            <div><Label>PAN Number</Label><Input value={form.panNumber} maxLength={10} placeholder="ABCDE1234F" className="uppercase" onChange={e => setForm(f => ({ ...f, panNumber: e.target.value.toUpperCase() }))} />{form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panNumber) && <p className="text-xs text-red-500 mt-1">Format: ABCDE1234F</p>}</div>

            {/* File uploads with existing file preview */}
            {[
              { key: "profilePhoto", label: "Profile Photo", accept: "image/*" },
              { key: "aadharDocument", label: "Aadhar Document", accept: "image/*,.pdf" },
              { key: "panDocument", label: "PAN Document", accept: "image/*,.pdf" },
              { key: "idProofDocument", label: "ID Proof", accept: "image/*,.pdf" },
            ].map(({ key, label, accept }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                {/* Show existing file or new file selected */}
                {(existingDocs[key] && !files[key]) ? (
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-xs text-green-700 truncate flex-1">Uploaded</span>
                    <a href={existingDocs[key]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <label className="cursor-pointer text-orange-600 hover:text-orange-800" title="Replace file">
                      <Upload className="w-3.5 h-3.5" />
                      <input type="file" accept={accept} className="hidden" onChange={e => setFiles(f => ({ ...f, [key]: e.target.files?.[0] || null }))} />
                    </label>
                  </div>
                ) : files[key] ? (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <Upload className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs text-blue-700 truncate flex-1">{files[key]!.name}</span>
                    <button type="button" onClick={() => setFiles(f => ({ ...f, [key]: null }))} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Input type="file" accept={accept} onChange={e => setFiles(f => ({ ...f, [key]: e.target.files?.[0] || null }))} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions — 3 buttons for create, 2 for edit */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          {isEdit ? (
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Update Employee
            </Button>
          ) : (
            <>
              <Button type="submit" variant="outline" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save as Draft
              </Button>
              <Button type="button" disabled={saving} onClick={async () => {
                if (!form.name || !form.email || !form.phone) { toast.error("Name, email, and phone are required"); return; }
                setSaving(true);
                try {
                  const formData = new FormData();
                  Object.entries(form).forEach(([key, value]) => { if (value) formData.append(key, value); });
                  Object.entries(files).forEach(([key, file]) => { if (file) formData.append(key, file); });
                  // Create as draft first
                  const createRes = await employeeService.createEmployee(formData);
                  if (createRes.success && createRes.data?.id) {
                    // Then immediately invite
                    await employeeService.updateStatus(createRes.data.id, { status: "invited" });
                    toast.success("Employee created & invitation sent!");
                    router.push("/dashboard/employees");
                  }
                } catch (err: unknown) {
                  const axiosErr = err as { response?: { data?: { error?: string } } };
                  toast.error(axiosErr?.response?.data?.error || "Failed to create & invite");
                } finally { setSaving(false); }
              }}
              className="bg-[#e63946] hover:bg-[#d62839]">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save & Invite
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
