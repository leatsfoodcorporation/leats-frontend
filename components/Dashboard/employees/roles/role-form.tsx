"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ChevronDown } from "lucide-react";
import { roleService } from "@/services/roleService";
import { PERMISSION_MODULES, PERMISSION_GROUPS } from "@/types/employee";
import type { Permission } from "@/types/employee";

interface RoleFormProps {
  roleId?: string;
}

export default function RoleForm({ roleId }: RoleFormProps) {
  const router = useRouter();
  const isEdit = !!roleId;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [expandedGroups, setExpandedGroups] =
    useState<string[]>(PERMISSION_GROUPS);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      roleService
        .getRoleById(roleId)
        .then((res) => {
          if (res.success) {
            setName(res.data.name);
            setDescription(res.data.description || "");
            setPermissions(res.data.permissions || []);
          }
        })
        .catch(() => toast.error("Failed to load role"))
        .finally(() => setLoading(false));
    }
  }, [roleId, isEdit]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group],
    );
  };

  const isActionChecked = (moduleKey: string, action: string) => {
    const perm = permissions.find((p) => p.module === moduleKey);
    return perm?.actions.includes(action as any) || false;
  };

  const toggleAction = (moduleKey: string, action: string) => {
    setPermissions((prev) => {
      const existing = prev.find((p) => p.module === moduleKey);
      if (existing) {
        const newActions = existing.actions.includes(action as any)
          ? existing.actions.filter((a) => a !== action)
          : [...existing.actions, action as any];
        if (newActions.length === 0)
          return prev.filter((p) => p.module !== moduleKey);
        return prev.map((p) =>
          p.module === moduleKey ? { ...p, actions: newActions } : p,
        );
      }
      return [...prev, { module: moduleKey, actions: [action as any] }];
    });
  };

  const toggleAllModule = (moduleKey: string, availableActions: string[]) => {
    const perm = permissions.find((p) => p.module === moduleKey);
    const allChecked = perm && perm.actions.length === availableActions.length;
    if (allChecked) {
      setPermissions((prev) => prev.filter((p) => p.module !== moduleKey));
    } else {
      setPermissions((prev) => {
        const filtered = prev.filter((p) => p.module !== moduleKey);
        return [
          ...filtered,
          { module: moduleKey, actions: availableActions as any },
        ];
      });
    }
  };

  const selectAll = () => {
    setPermissions(
      PERMISSION_MODULES.map((m) => ({
        module: m.key,
        actions: m.actions as any,
      })),
    );
  };

  const clearAll = () => {
    setPermissions([]);
  };

  const totalSelected = permissions.reduce(
    (sum, p) => sum + p.actions.length,
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Role name is required");
      return;
    }
    if (permissions.length === 0) {
      toast.error("Select at least one permission");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await roleService.updateRole(roleId, {
          name,
          description,
          permissions,
        });
        toast.success("Role updated");
      } else {
        await roleService.createRole({ name, description, permissions });
        toast.success("Role created");
      }
      router.push("/dashboard/employees/roles");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold flex-1">
          {isEdit ? "Edit Role" : "Create Role"}
        </h1>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={saving}
          onClick={() => {
            if (!name.trim()) {
              toast.error("Role name is required");
              return;
            }
            if (permissions.length === 0) {
              toast.error("Select at least one permission");
              return;
            }
            handleSubmit({ preventDefault: () => {} } as React.FormEvent);
          }}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {isEdit ? "Update Role" : "Create Role"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg border p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Role Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Manager"
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Store manager role"
              />
            </div>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="bg-white rounded-lg border p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">
              Permissions ({totalSelected} selected)
            </h2>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAll}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAll}
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {PERMISSION_GROUPS.map((group) => {
              const groupModules = PERMISSION_MODULES.filter(
                (m) => m.group === group,
              );
              const isExpanded = expandedGroups.includes(group);

              return (
                <div key={group} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-sm">{group}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="p-3">
                      {/* Header */}
                      <div className="grid grid-cols-[1fr_repeat(4,_48px)_48px] gap-1 text-[10px] sm:text-xs text-gray-500 font-medium mb-2 px-1">
                        <span>Module</span>
                        <span className="text-center">View</span>
                        <span className="text-center">Add</span>
                        <span className="text-center">Edit</span>
                        <span className="text-center">Del</span>
                        <span className="text-center">All</span>
                      </div>

                      {groupModules.map((mod) => (
                        <div
                          key={mod.key}
                          className="grid grid-cols-[1fr_repeat(4,_48px)_48px] gap-1 items-center py-1.5 px-1 hover:bg-gray-50 rounded text-sm"
                        >
                          <span className="truncate">{mod.label}</span>
                          {["view", "add", "edit", "delete"].map((action) => (
                            <div key={action} className="flex justify-center">
                              {mod.actions.includes(action) ? (
                                <input
                                  type="checkbox"
                                  checked={isActionChecked(mod.key, action)}
                                  onChange={() => toggleAction(mod.key, action)}
                                  className="w-4 h-4 rounded border-gray-300 text-[#e63946] focus:ring-[#e63946]"
                                />
                              ) : (
                                <span className="text-gray-200">—</span>
                              )}
                            </div>
                          ))}
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={
                                permissions.find((p) => p.module === mod.key)
                                  ?.actions.length === mod.actions.length
                              }
                              onChange={() =>
                                toggleAllModule(mod.key, mod.actions)
                              }
                              className="w-4 h-4 rounded border-gray-300 text-[#e63946] focus:ring-[#e63946]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isEdit ? "Update Role" : "Create Role"}
          </Button>
        </div>
      </form>
    </div>
  );
}
