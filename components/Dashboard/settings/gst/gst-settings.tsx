"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GSTRate {
  id?: string;
  name: string;
  gstPercentage: number;
  isActive: boolean;
}

export const GSTSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gstRates, setGstRates] = useState<GSTRate[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState<GSTRate>({
    name: "",
    gstPercentage: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchGSTRates();
  }, []);

  const fetchGSTRates = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/finance/gst-rates");
      if (response.data.success) {
        setGstRates(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching GST rates:", error);
      toast.error("Failed to load GST rates");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof GSTRate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddGST = async () => {
    try {
      if (!formData.name || formData.gstPercentage <= 0) {
        toast.error("Please fill in all required fields");
        return;
      }

      setSaving(true);
      const response = await axiosInstance.post("/api/finance/gst-rates", formData);

      if (response.data.success) {
        toast.success("GST rate added successfully");
        setShowAddForm(false);
        setFormData({
          name: "",
          gstPercentage: 0,
          isActive: true,
        });
        fetchGSTRates();
      }
    } catch (error: any) {
      console.error("Error adding GST rate:", error);
      const errorMessage = error.response?.data?.error || "Failed to add GST rate";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await axiosInstance.patch(`/api/finance/gst-rates/${id}/status`, { 
        isActive: !currentStatus 
      });

      if (response.data.success) {
        setGstRates((prev) =>
          prev.map((rate) =>
            rate.id === id ? { ...rate, isActive: !currentStatus } : rate
          )
        );
        toast.success("GST rate status updated");
      }
    } catch (error) {
      console.error("Error updating GST rate:", error);
      toast.error("Failed to update GST rate");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await axiosInstance.delete(`/api/finance/gst-rates/${id}`);

      if (response.data.success) {
        setGstRates((prev) => prev.filter((rate) => rate.id !== id));
        toast.success("GST rate deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting GST rate:", error);
      toast.error("Failed to delete GST rate");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GST Rates List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>GST Configuration</CardTitle>
              <CardDescription>
                Manage GST rates for your products and services
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Add GST Rate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>GST %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gstRates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground"
                  >
                    No GST rates configured. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                gstRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.name}</TableCell>
                    <TableCell>{rate.gstPercentage}%</TableCell>
                    <TableCell>
                      <Switch
                        checked={rate.isActive}
                        onCheckedChange={() =>
                          handleToggleStatus(rate.id!, rate.isActive)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(rate.id!)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add GST Rate Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New GST Rate</CardTitle>
            <CardDescription>
              Configure a new GST rate for your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">GST Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., GST 18%"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstPercentage">Total GST Percentage *</Label>
                <Input
                  id="gstPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.gstPercentage}
                  onChange={(e) =>
                    handleChange("gstPercentage", e.target.value)
                  }
                  placeholder="18"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    handleChange("isActive", checked)
                  }
                />
                <Label>Active</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddGST} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add GST Rate"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
