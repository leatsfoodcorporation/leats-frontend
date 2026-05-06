"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { CountryStateCitySelect } from "@/components/ui/country-state-city-select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Plus,
  MapPin,
  Trash2,
  Edit,
  X,
  Truck,
  Loader2,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  getAllDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  discoverPincodesAI,
  type DeliveryZone,
} from "@/services/deliveryZoneService";
import { Sparkles } from "lucide-react";

const DeliveryZoneSettings = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [deleteZoneId, setDeleteZoneId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    country: "",
    state: "",
    city: "",
    isAllPincodes: false,
  });
  const [pincodeInput, setPincodeInput] = useState("");
  const [pincodes, setPincodes] = useState<string[]>([]);
  const [isFetchingPincodes, setIsFetchingPincodes] = useState(false);
  const [isDiscoveringAI, setIsDiscoveringAI] = useState(false);
  const [fetchedPincodes, setFetchedPincodes] = useState<{ pincode: string; names: string[] }[]>([]);
  const [showPincodeSelector, setShowPincodeSelector] = useState(false);

  // Fetch zones
  const fetchZones = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllDeliveryZones();
      setZones(data);
    } catch (error) {
      console.error("Error fetching delivery zones:", error);
      toast.error("Failed to fetch delivery zones");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // URL Sync: From URL to State
  useEffect(() => {
    const stateParam = searchParams.get("state");
    if (stateParam) {
      setSelectedState(stateParam);
    } else {
      setSelectedState(null);
    }
  }, [searchParams]);

  // URL Sync Handler
  const updateSelectedState = (state: string | null) => {
    setSelectedState(state);
    const params = new URLSearchParams(searchParams.toString());
    if (state) {
      params.set("state", state);
    } else {
      params.delete("state");
    }
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  // Reset form
  const resetForm = () => {
    setFormData({ country: "", state: "", city: "", isAllPincodes: false });
    setPincodeInput("");
    setPincodes([]);
    setEditingZone(null);
    setFetchedPincodes([]);
    setShowPincodeSelector(false);
  };

  // Open dialog for new zone
  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing
  const openEditDialog = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormData({
      country: zone.country,
      state: zone.state,
      city: zone.city,
      isAllPincodes: zone.isAllPincodes || false,
    });
    setPincodes([...zone.pincodes]);
    setPincodeInput("");
    setIsDialogOpen(true);
  };

  // Add pincode tag
  const addPincode = () => {
    const trimmed = pincodeInput.trim();
    if (!trimmed) return;

    // Support comma-separated bulk input
    const newPincodes = trimmed
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && !pincodes.includes(p));

    if (newPincodes.length > 0) {
      setPincodes((prev) => [...prev, ...newPincodes]);
    }
    setPincodeInput("");
  };

  // Handle keydown for pincode input
  const handlePincodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addPincode();
    }
  };

  // Remove pincode tag
  const removePincode = (pincode: string) => {
    setPincodes((prev) => prev.filter((p) => p !== pincode));
  };

  // Fetch pincodes for city
  const fetchCityPincodes = async () => {
    if (!formData.city) {
      toast.error("Please select a city first");
      return;
    }

    setIsFetchingPincodes(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/postoffice/${formData.city}`);
      const data = await response.json();

      if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
        let postOffices = data[0].PostOffice;
        const stateLower = formData.state?.toLowerCase();
        const cityLower = formData.city?.toLowerCase();

        postOffices = postOffices.filter((po: any) => {
          if (!po) return false;
          const poState = (po.State || "").toLowerCase();
          const poDistrict = (po.District || "").toLowerCase();
          const poDivision = (po.Division || "").toLowerCase();
          const poBlock = (po.Block || "").toLowerCase();
          const poName = (po.Name || "").toLowerCase();

          if (stateLower) {
            const matchesState = poState === stateLower || poState.includes(stateLower) || stateLower.includes(poState);
            if (!matchesState) return false;
          }

          const isExactRegionMatch = 
            (poDistrict && poDistrict === cityLower) || 
            (poDivision && poDivision === cityLower) || 
            (poBlock && poBlock === cityLower);

          let isNameWordMatch = false;
          if (poName && cityLower) {
            try {
              const nameMatchRegex = new RegExp(`\\b${cityLower}\\b`, 'i');
              isNameWordMatch = nameMatchRegex.test(poName);
            } catch (e) {
              isNameWordMatch = poName.includes(cityLower);
            }
          }

          return isExactRegionMatch || isNameWordMatch;
        });

        if (postOffices.length === 0) {
          toast.error(`No accurate pincodes found for ${formData.city} in ${formData.state}`);
          return;
        }
        
        const pincodeMap = new Map<string, string[]>();
        postOffices.forEach((po: any) => {
          const existing = pincodeMap.get(po.Pincode) || [];
          if (!existing.includes(po.Name)) {
            existing.push(po.Name);
          }
          pincodeMap.set(po.Pincode, existing);
        });

        const results = Array.from(pincodeMap.entries()).map(([pincode, names]) => ({
          pincode,
          names,
        })).sort((a, b) => a.pincode.localeCompare(b.pincode));

        setFetchedPincodes(results);
        setShowPincodeSelector(true);
      } else {
        toast.error(`No pincodes found for ${formData.city}`);
      }
    } catch (error) {
      console.error("Error fetching city pincodes:", error);
      toast.error("Failed to fetch pincodes. Service may be unavailable.");
    } finally {
      setIsFetchingPincodes(false);
    }
  };

  // Fetch pincodes via AI
  const fetchCityPincodesAI = async (silent: boolean = false) => {
    if (!formData.city || !formData.state) {
      if (!silent) toast.error("Please select a city and state first");
      return;
    }

    if (!silent) setIsDiscoveringAI(true);
    try {
      const result = await discoverPincodesAI({
        city: formData.city,
        state: formData.state,
        country: formData.country
      });

      if (result && result.pincodes && result.pincodes.length > 0) {
        const formattedResults = result.pincodes.map(p => ({
          pincode: p,
          names: [`${formData.city} Area`]
        })).sort((a, b) => a.pincode.localeCompare(b.pincode));

        if (silent) {
          setPincodes(result.pincodes);
        } else {
          setFetchedPincodes(formattedResults);
          setShowPincodeSelector(true);
          toast.success(`AI discovered ${result.pincodes.length} accurate pincodes`);
        }
      } else if (!silent) {
        toast.error(`AI could not find verified pincodes for ${formData.city}`);
      }
    } catch (error) {
      console.error("AI Pincode Discovery Error:", error);
      if (!silent) toast.error("AI service failed. Using fallback search.");
    } finally {
      if (!silent) setIsDiscoveringAI(false);
    }
  };

  const addAllFetchedPincodes = () => {
    const allPincodes = fetchedPincodes.map(p => p.pincode);
    setPincodes(prev => Array.from(new Set([...prev, ...allPincodes])));
    setShowPincodeSelector(false);
    toast.success(`Added ${allPincodes.length} pincodes for ${formData.city}`);
  };

  // Save zone
  const handleSave = async () => {
    if (!formData.state || !formData.city) {
      toast.error("State and City are required");
      return;
    }

    if (!formData.isAllPincodes && pincodes.length === 0) {
      toast.error("At least one pincode is required");
      return;
    }

    setIsSaving(true);
    try {
      if (editingZone) {
        await updateDeliveryZone(editingZone.id, {
          country: formData.country,
          state: formData.state,
          city: formData.city,
          pincodes,
          isAllPincodes: formData.isAllPincodes,
        });
        toast.success(`${formData.city} zone updated successfully`);
      } else {
        await createDeliveryZone({
          country: formData.country,
          state: formData.state,
          city: formData.city,
          pincodes,
          isAllPincodes: formData.isAllPincodes,
        });
        toast.success(`${formData.city} zone created successfully`);
      }

      setIsDialogOpen(false);
      resetForm();
      fetchZones();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save delivery zone");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete zone
  const handleDelete = async () => {
    if (!deleteZoneId) return;
    try {
      await deleteDeliveryZone(deleteZoneId);
      setZones((prev) => prev.filter((z) => z.id !== deleteZoneId));
      toast.success("Delivery zone deleted");
    } catch {
      toast.error("Failed to delete delivery zone");
    } finally {
      setDeleteZoneId(null);
    }
  };

  // Toggle zone active status
  const handleToggleActive = async (zone: DeliveryZone) => {
    const previousZones = [...zones];
    setZones((prev) => prev.map((z) => z.id === zone.id ? { ...z, isActive: !z.isActive } : z));

    try {
      await updateDeliveryZone(zone.id, { isActive: !zone.isActive });
      toast.success(`${zone.city} ${!zone.isActive ? "activated" : "deactivated"}`);
    } catch {
      setZones(previousZones);
      toast.error("Failed to update zone status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-60" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Syncing delivery zones...
        </p>
      </div>
    );
  }

  // Logical groupings
  const stateGroups = Array.from(
    zones.reduce((acc, zone) => {
      const state = zone.state;
      if (!acc.has(state)) {
        acc.set(state, {
          state,
          country: zone.country,
          cityCount: 0,
          activeCount: 0,
        });
      }
      const group = acc.get(state)!;
      group.cityCount++;
      if (zone.isActive) group.activeCount++;
      return acc;
    }, new Map<string, { state: string, country: string, cityCount: number, activeCount: number }>())
  ).map(([_, data]) => data);

  const filteredZones = selectedState 
    ? zones.filter(z => z.state === selectedState) 
    : [];

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {selectedState ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => updateSelectedState(null)}
                  className="h-9 w-9 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="opacity-60 font-medium">Zones /</span> {selectedState}
              </>
            ) : (
              <>
                <Truck className="h-6 w-6 text-primary" />
                Delivery Zone Management
              </>
            )}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {selectedState 
              ? `Manage cities and serviceability for ${selectedState}.`
              : "Grouped by state. Select a state to manage its delivery cities."}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="gap-2 bg-primary hover:bg-primary/90 shadow-md">
              <Plus className="h-4 w-4" />
              Add Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>
                {editingZone ? "Edit Delivery Zone" : "Add New Delivery Zone"}
              </DialogTitle>
              <DialogDescription>
                Select location and add serviceable pincodes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <CountryStateCitySelect
                value={{
                  country: formData.country,
                  state: formData.state,
                  city: formData.city,
                }}
                onChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    country: value.country,
                    state: value.state,
                    city: value.city,
                  }));
                }}
                required
              />

              <Separator />

              <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Cover Entire City
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically service all pincodes in {formData.city || "this city"}
                  </p>
                </div>
                <Switch
                  checked={formData.isAllPincodes}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({ ...prev, isAllPincodes: checked }));
                    if (checked) {
                      fetchCityPincodesAI(true);
                    }
                  }}
                />
              </div>

              {!formData.isAllPincodes && (
                <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-1">
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Manage Pincodes</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter 6-digit pincode"
                        value={pincodeInput}
                        onChange={(e) => setPincodeInput(e.target.value)}
                        onKeyDown={handlePincodeKeyDown}
                        maxLength={6}
                      />
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={addPincode}
                        disabled={pincodeInput.length !== 6}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1.5"
                      onClick={() => fetchCityPincodes()}
                      disabled={isFetchingPincodes || !formData.city}
                    >
                      {isFetchingPincodes ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      Fetch Fast
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                      onClick={() => fetchCityPincodesAI()}
                      disabled={isDiscoveringAI || !formData.city}
                    >
                      {isDiscoveringAI ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      AI Deep Verify
                    </Button>

                    {fetchedPincodes.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 text-primary font-semibold"
                        onClick={() => setShowPincodeSelector(true)}
                      >
                        Select from {fetchedPincodes.length}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Pincode Selector View */}
              {showPincodeSelector && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg border-2 border-primary/20 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      Found {fetchedPincodes.length} Pincodes
                    </h4>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPincodeSelector(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto pr-2 mb-3">
                    <div className="grid grid-cols-3 gap-2">
                      {fetchedPincodes.map((item) => (
                        <div 
                          key={item.pincode}
                          onClick={() => {
                            if (!pincodes.includes(item.pincode)) {
                              setPincodes(prev => [...prev, item.pincode]);
                            } else {
                              setPincodes(prev => prev.filter(p => p !== item.pincode));
                            }
                          }}
                          className={cn(
                            "text-[11px] p-2 rounded border cursor-pointer transition-colors text-center",
                            pincodes.includes(item.pincode) 
                              ? "bg-primary text-primary-foreground font-bold" 
                              : "bg-background hover:border-primary/50"
                          )}
                        >
                          {item.pincode}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" className="flex-1 text-xs" onClick={addAllFetchedPincodes}>Add All</Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setShowPincodeSelector(false)}>Done</Button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1 scrollbar-hide">
                {pincodes.map((pincode) => (
                  <Badge
                    key={pincode}
                    variant="secondary"
                    className="gap-1 px-2 py-1 pr-1 font-medium bg-muted/50 border"
                  >
                    {pincode}
                    <button
                      type="button"
                      onClick={() => removePincode(pincode)}
                      className="hover:text-destructive transition-colors rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingZone ? "Update Zone" : "Create Zone"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="opacity-50" />

      {zones.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Globe className="h-16 w-16 text-muted-foreground/20 mb-6" />
            <h3 className="text-xl font-bold">No Delivery Zones Setup</h3>
            <p className="text-muted-foreground text-sm max-w-[300px] text-center mt-2 mb-8">
              Configure your service areas to manage delivery availability and pincodes.
            </p>
            <Button onClick={openNewDialog} className="px-8 rounded-full">Add First Location</Button>
          </CardContent>
        </Card>
      ) : !selectedState ? (
        /* ================= STATE VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {stateGroups.map((group) => (
            <Card 
              key={group.state} 
              className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 border-2 hover:border-primary/20 cursor-pointer overflow-hidden relative active:scale-[0.98]"
              onClick={() => updateSelectedState(group.state)}
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <ChevronRight className="h-6 w-6" />
                </div>
              </div>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 ease-out">
                    <MapPin className="h-7 w-7" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                      {group.state}
                    </CardTitle>
                    <CardDescription className="font-bold flex items-center gap-1.5 opacity-70">
                      <Globe className="h-3 w-3" />
                      {group.country}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mt-2">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black tracking-tighter text-foreground/80">
                      {group.cityCount}
                    </span>
                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none">
                      Cities
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-10 opacity-50" />
                  <div className="flex flex-col">
                    <span className="text-3xl font-black tracking-tighter text-green-500">
                      {group.activeCount}
                    </span>
                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none">
                      Live
                    </span>
                  </div>
                </div>
              </CardContent>
              <div className="h-1 w-full bg-primary/5 group-hover:bg-primary transition-colors duration-500 mt-2" />
            </Card>
          ))}
        </div>
      ) : (
        /* ================= CITY VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
          {filteredZones.map((zone) => (
            <Card key={zone.id} className={cn(
               "h-full transition-all duration-300 border-2 overflow-hidden flex flex-col group/city",
               !zone.isActive ? "opacity-70 grayscale-[0.3]" : "hover:border-primary/20 hover:shadow-xl shadow-sm"
            )}>
              <CardContent className="p-0 flex-1">
                <div className="p-6 flex flex-col h-full gap-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-2 rounded-lg",
                          zone.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <MapPin className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-lg leading-tight uppercase">
                          {zone.city}
                        </h3>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground px-1">
                        {zone.state}, {zone.country}
                      </p>
                    </div>
                    <Switch
                      checked={zone.isActive}
                      onCheckedChange={() => handleToggleActive(zone)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {zone.isActive ? (
                      <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-500/20 px-2 py-0 text-[10px] uppercase font-bold tracking-wider">
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                        Paused
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      • {zone.isAllPincodes ? "100% City Coverage" : `${zone.pincodes.length} PIN CODES`}
                    </span>
                  </div>

                  <div className="flex-1 min-h-[60px] max-h-[120px] overflow-y-auto scrollbar-hide py-1">
                    <div className="flex flex-wrap gap-1.5">
                      {zone.isAllPincodes ? (
                        <div className="text-[11px] text-primary/60 italic font-medium px-2 py-1 rounded bg-primary/5 w-full">Full city coverage enabled.</div>
                      ) : (
                        zone.pincodes.map((p) => (
                          <span key={p} className="text-[11px] px-2 py-0.5 rounded-full bg-muted border font-semibold text-muted-foreground">{p}</span>
                        ))
                      )}
                    </div>
                  </div>

                  <Separator className="opacity-50" />

                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                      Edited {new Date(zone.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="secondary" size="sm" onClick={() => openEditDialog(zone)} className="h-8 w-8 p-0 rounded-full hover:scale-110 transition-transform">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteZoneId(zone.id)} className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/10 hover:scale-110 transition-transform">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteZoneId}
        onOpenChange={(open) => !open && setDeleteZoneId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Delivery Zone?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this delivery zone and all its
              pincodes. Users in these areas will no longer be able to order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg"
            >
              Delete Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export { DeliveryZoneSettings };
export default DeliveryZoneSettings;
