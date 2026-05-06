"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Edit2, RotateCcw, Eye, EyeOff } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  isStatic: boolean;
  sortOrder: number;
  enabledForHomepage: boolean;
}

interface BadgeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  staticBadges: Badge[];
  customBadges: Badge[];
  onAddBadge: (name: string, sortOrder?: number, enabledForHomepage?: boolean) => Promise<void>;
  onEditBadge: (id: string, name: string, sortOrder?: number, enabledForHomepage?: boolean) => Promise<void>;
  onResetBadge?: (id: string) => Promise<void>;
  onToggleHomepage?: (id: string, enabled: boolean) => Promise<void>;
  label: string;
  disabled?: boolean;
  allowCustomBadges?: boolean;
  showStaticBadgesHeading?: boolean;
}

export function BadgeSelector({
  value,
  onChange,
  staticBadges,
  customBadges,
  onAddBadge,
  onEditBadge,
  onResetBadge,
  onToggleHomepage,
  label,
  disabled = false,
  allowCustomBadges = true,
  showStaticBadgesHeading = true,
}: BadgeSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgeSortOrder, setNewBadgeSortOrder] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string; sortOrder: number; isStatic: boolean; enabledForHomepage: boolean } | null>(null);
  const [editName, setEditName] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("");
  const [explicitlyClosing, setExplicitlyClosing] = useState(false);

  const handleAdd = async () => {
    const sortOrder = newBadgeSortOrder ? parseInt(newBadgeSortOrder) : undefined;
    await onAddBadge(newBadgeName, sortOrder);
    setNewBadgeName("");
    setNewBadgeSortOrder("");
    setShowAdd(false);
    setDropdownOpen(false);
    setExplicitlyClosing(true);
  };

  const handleEdit = async () => {
    if (editing) {
      const sortOrder = editSortOrder ? parseInt(editSortOrder) : editing.sortOrder;
      await onEditBadge(editing.id, editName, sortOrder);
      setEditing(null);
      setEditName("");
      setEditSortOrder("");
      setDropdownOpen(false);
      setExplicitlyClosing(true);
    }
  };

  const handleToggleHomepage = async (badgeId: string, currentEnabled: boolean) => {
    if (onToggleHomepage) {
      await onToggleHomepage(badgeId, !currentEnabled);
      setDropdownOpen(true);
    }
  };

  const handleReset = async (badgeId: string) => {
    if (onResetBadge) {
      await onResetBadge(badgeId);
      // Don't close dropdown, just keep it open
      setDropdownOpen(true);
    }
  };

  const handleCancel = () => {
    setShowAdd(false);
    setNewBadgeName("");
    setNewBadgeSortOrder("");
    setEditing(null);
    setEditName("");
    setEditSortOrder("");
    setExplicitlyClosing(true);
    setDropdownOpen(false);
  };

  return (
    <div className="relative">
      <Label className="text-base font-medium">{label}</Label>
      <div className="mt-2 space-y-2">
        <Select
          value={value}
          onValueChange={(val) => {
            if (val === "add_new_badge") {
              setEditing(null);
              setEditName("");
              setEditSortOrder("");
              setShowAdd(true);
              setNewBadgeName("");
              setNewBadgeSortOrder("");
              setDropdownOpen(true);
            } else {
              onChange(val);
              setDropdownOpen(false);
            }
          }}
          open={dropdownOpen}
          onOpenChange={(open) => {
            if (!open && (editing || showAdd) && !explicitlyClosing) {
              setDropdownOpen(true);
              return;
            }
            setDropdownOpen(open);
            if (explicitlyClosing) {
              setExplicitlyClosing(false);
            }
            if (!open && !explicitlyClosing) {
              setShowAdd(false);
              setEditing(null);
              setNewBadgeName("");
              setNewBadgeSortOrder("");
              setEditName("");
              setEditSortOrder("");
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Select badge" />
          </SelectTrigger>
        <SelectContent className="z-50" data-no-search="true">
          <SelectItem value="none" className="cursor-pointer">No Badge</SelectItem>
          
          {/* Static Badges Section */}
          {staticBadges.length > 0 && (
            <>
              {showStaticBadgesHeading && (
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted mt-1">
                  STATIC BADGES
                </div>
              )}
              {staticBadges.map((badge) => (
                <div key={badge.id} className="flex items-center justify-between">
                  <SelectItem value={badge.name} className="flex-1 cursor-pointer">
                    <span className="font-medium text-blue-600 mr-2">{badge.sortOrder}</span>
                    <span>-</span>
                    <span className="ml-2">{badge.name}</span>
                  </SelectItem>
                  <div className="flex items-center gap-1 pr-2">
                    {onToggleHomepage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 cursor-pointer p-0 hover:bg-green-100 dark:hover:bg-green-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleHomepage(badge.id, badge.enabledForHomepage);
                        }}
                        title={badge.enabledForHomepage ? "Disable for homepage" : "Enable for homepage"}
                      >
                        {badge.enabledForHomepage ? (
                          <Eye className="h-3 w-3 text-green-600" />
                        ) : (
                          <EyeOff className="h-3 w-3 text-gray-400" />
                        )}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 cursor-pointer p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAdd(false);
                        setNewBadgeName("");
                        setNewBadgeSortOrder("");
                        setEditing({ 
                          id: badge.id, 
                          name: badge.name, 
                          sortOrder: badge.sortOrder,
                          isStatic: badge.isStatic,
                          enabledForHomepage: badge.enabledForHomepage
                        });
                        setEditName(badge.name);
                        setEditSortOrder(badge.sortOrder.toString());
                        setDropdownOpen(true);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    {onResetBadge && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 cursor-pointer p-0 hover:bg-orange-100 dark:hover:bg-orange-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReset(badge.id);
                        }}
                      >
                        <RotateCcw className="h-3 w-3 text-orange-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Custom Badges Section */}
          {allowCustomBadges && customBadges.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted mt-1">
                CUSTOM BADGES
              </div>
              {customBadges.map((badge) => (
                <div key={badge.id} className="flex items-center justify-between">
                  <SelectItem value={badge.name} className="flex-1 cursor-pointer">
                    <span className="font-medium text-purple-600 mr-2">{badge.sortOrder}</span>
                    <span>-</span>
                    <span className="ml-2">{badge.name}</span>
                  </SelectItem>
                  <div className="flex items-center gap-1 pr-2">
                    {onToggleHomepage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 cursor-pointer p-0 hover:bg-green-100 dark:hover:bg-green-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleHomepage(badge.id, badge.enabledForHomepage);
                        }}
                        title={badge.enabledForHomepage ? "Disable for homepage" : "Enable for homepage"}
                      >
                        {badge.enabledForHomepage ? (
                          <Eye className="h-3 w-3 text-green-600" />
                        ) : (
                          <EyeOff className="h-3 w-3 text-gray-400" />
                        )}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 cursor-pointer p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAdd(false);
                        setNewBadgeName("");
                        setNewBadgeSortOrder("");
                        setEditing({ 
                          id: badge.id, 
                          name: badge.name, 
                          sortOrder: badge.sortOrder,
                          isStatic: badge.isStatic,
                          enabledForHomepage: badge.enabledForHomepage
                        });
                        setEditName(badge.name);
                        setEditSortOrder(badge.sortOrder.toString());
                        setDropdownOpen(true);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Add New Badge */}
          {allowCustomBadges && (
            <div
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1.5 text-sm flex items-center text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700 mt-1"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setEditing(null);
                setEditName("");
                setEditSortOrder("");
                setShowAdd(true);
                setNewBadgeName("");
                setNewBadgeSortOrder("");
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Badge
            </div>
          )}

          {showAdd && allowCustomBadges && (
            <div
              className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Add New Badge
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="hover:bg-gray-200 cursor-pointer dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Input
                  value={newBadgeName}
                  onChange={(e) => setNewBadgeName(e.target.value)}
                  placeholder="Enter badge name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                    e.stopPropagation();
                  }}
                  onFocus={(e) => e.stopPropagation()}
                />
                <Input
                  type="number"
                  value={newBadgeSortOrder}
                  onChange={(e) => setNewBadgeSortOrder(e.target.value)}
                  placeholder="Sort order (optional)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                    e.stopPropagation();
                  }}
                  onFocus={(e) => e.stopPropagation()}
                />
                <Button type="button" onClick={handleAdd} size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          )}

          {editing && (
            <div
              className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Edit Badge
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter badge name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleEdit();
                    }
                    e.stopPropagation();
                  }}
                  onFocus={(e) => e.stopPropagation()}
                />
                <Input
                  type="number"
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(e.target.value)}
                  placeholder="Sort order"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleEdit();
                    }
                    e.stopPropagation();
                  }}
                  onFocus={(e) => e.stopPropagation()}
                />
                <Button type="button" onClick={handleEdit} size="sm" className="w-full">
                  <Edit2 className="h-4 w-4 mr-1" />
                  Update
                </Button>
              </div>
            </div>
          )}
        </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        Add a promotional badge to attract attention
      </p>
    </div>
  );
}
