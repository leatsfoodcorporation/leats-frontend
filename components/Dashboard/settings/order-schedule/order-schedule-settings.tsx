"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Clock,
  Loader2,
  ShoppingBag,
  Timer,
  Bell,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
} from "lucide-react";
import {
  getOrderSchedule,
  updateOrderSchedule,
  type OrderScheduleSettings,
} from "@/services/orderScheduleService";
import { TimeWindowCard } from "./TimeWindowCard";
import { DeliverySlotCard } from "./DeliverySlotCard";

const DEFAULT: OrderScheduleSettings = {
  liveOrderEnabled: true,
  liveOrderStartTime: "05:00",
  liveOrderEndTime: "11:59",
  liveOrderLabel: "Live Order",
  preOrderEnabled: true,
  preOrderStartTime: "12:00",
  preOrderEndTime: "23:59",
  preOrderLabel: "Pre-Order",
  countdownEnabled: true,
};

// Convert "HH:MM" (24hr) to "hh:MM AM/PM" for display
const to12hr = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

// Helper: get status labels for windows
const getWindowStatus = (settings: OrderScheduleSettings, type: 'LIVE' | 'PRE_ORDER') => {
  const active = settings.windowStatus?.activeWindow === type;
  return {
    active,
    label: type === 'LIVE' ? (settings.liveOrderLabel || "Live Order") : (settings.preOrderLabel || "Pre-Order")
  };
};

export function OrderScheduleSettingsComponent() {
  const [settings, setSettings] = useState<OrderScheduleSettings>(DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await getOrderSchedule();
      setSettings(data);
    } catch (err) {
      if (!silent) toast.error("Failed to load order schedule settings");
      console.error("Fetch settings error:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Keep status updated every minute
  useEffect(() => {
    const interval = setInterval(() => fetchSettings(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await updateOrderSchedule({
        liveOrderEnabled: settings.liveOrderEnabled,
        liveOrderStartTime: settings.liveOrderStartTime,
        liveOrderEndTime: settings.liveOrderEndTime,
        liveOrderLabel: settings.liveOrderLabel,
        preOrderEnabled: settings.preOrderEnabled,
        preOrderStartTime: settings.preOrderStartTime,
        preOrderEndTime: settings.preOrderEndTime,
        preOrderLabel: settings.preOrderLabel,
        countdownEnabled: settings.countdownEnabled,
        deliverySlots: settings.deliverySlots,
        schedulingEnabled: settings.schedulingEnabled,
      });
      setSettings(updated);
      toast.success("Order schedule settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const update = (key: keyof OrderScheduleSettings, value: string | boolean | string[]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const addSlot = (slot: string) => {
    const currentSlots = settings.deliverySlots || [];
    if (currentSlots.includes(slot)) {
      toast.error("Slot already exists");
      return;
    }
    update("deliverySlots", [...currentSlots, slot]);
  };

  const removeSlot = (index: number) => {
    const currentSlots = settings.deliverySlots || [];
    const newSlots = currentSlots.filter((_, i) => i !== index);
    update("deliverySlots", newSlots);
  };

  const activeWindow = settings.windowStatus?.activeWindow || "CLOSED";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Order Schedule
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure live order and pre-order time windows. Customers can only
            place orders within these windows.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>

      {/* Current Status Card */}
      {settings.windowStatus && (
        <Card className={`border-2 ${
          activeWindow === 'LIVE' ? 'border-green-200 bg-green-50/30' : 
          activeWindow === 'PRE_ORDER' ? 'border-blue-200 bg-blue-50/30' : 
          'border-dashed border-gray-200'
        }`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  activeWindow === 'CLOSED' ? 'bg-red-400' : 'bg-green-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  activeWindow === 'CLOSED' ? 'bg-red-500' : 'bg-green-500'
                }`}></span>
              </span>
              Current Shop Status (IST)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-center">
            <div className="text-4xl font-mono font-bold tracking-tighter">
              {settings.windowStatus.currentTime}
            </div>
            <div className="flex flex-col gap-1">
              {activeWindow === "LIVE" && (
                <Badge className="bg-green-600 hover:bg-green-700 gap-1.5 text-sm px-4 py-1.5 shadow-sm">
                  <CheckCircle2 className="h-4 w-4" /> {settings.liveOrderLabel} ACTIVE
                </Badge>
              )}
              {activeWindow === "PRE_ORDER" && (
                <Badge className="bg-blue-600 hover:bg-blue-700 gap-1.5 text-sm px-4 py-1.5 shadow-sm">
                  <ShoppingBag className="h-4 w-4" /> {settings.preOrderLabel} ACTIVE
                </Badge>
              )}
              {activeWindow === "CLOSED" && (
                <Badge variant="destructive" className="gap-1.5 text-sm px-4 py-1.5 shadow-sm">
                  <XCircle className="h-4 w-4" /> RECEPTION CLOSED
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground font-medium uppercase ml-1">
                {activeWindow === "CLOSED" 
                  ? `Next window: ${settings.windowStatus.nextWindowLabel} at ${to12hr(settings.windowStatus.nextWindowTime)}`
                  : `Currently accepting orders for ${activeWindow === 'LIVE' ? 'today' : 'scheduled delivery'}`
                }
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Live Order Section */}
      <TimeWindowCard
        title="Live Order Window"
        description="Orders placed in this window are delivered today (on-time delivery)"
        icon={<ShoppingBag className="h-5 w-5" />}
        windowLabel={settings.liveOrderLabel}
        startTime={settings.liveOrderStartTime}
        endTime={settings.liveOrderEndTime}
        enabled={settings.liveOrderEnabled}
        isActive={activeWindow === "LIVE"}
        activeLabel="Live"
        onUpdate={update}
        enabledKey="liveOrderEnabled"
        labelKey="liveOrderLabel"
        startTimeKey="liveOrderStartTime"
        endTimeKey="liveOrderEndTime"
        to12hr={to12hr}
        accentColor="text-green-600"
      />

      {/* Pre-Order Section */}
      <TimeWindowCard
        title="Pre-Order Window"
        description="Orders placed in this window are scheduled for the next available delivery slot"
        icon={<Timer className="h-5 w-5" />}
        windowLabel={settings.preOrderLabel}
        startTime={settings.preOrderStartTime}
        endTime={settings.preOrderEndTime}
        enabled={settings.preOrderEnabled}
        isActive={activeWindow === "PRE_ORDER"}
        activeLabel="Pre-Order"
        onUpdate={update}
        enabledKey="preOrderEnabled"
        labelKey="preOrderLabel"
        startTimeKey="preOrderStartTime"
        endTimeKey="preOrderEndTime"
        to12hr={to12hr}
        accentColor="text-blue-600"
      />

      {/* Countdown Banner Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              <div>
                <CardTitle>Countdown Banner</CardTitle>
                <CardDescription>
                  Show a live countdown timer in the website top bar instead of
                  the default welcome message
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.countdownEnabled}
              onCheckedChange={(v) => update("countdownEnabled", v)}
            />
          </div>
        </CardHeader>
        {settings.countdownEnabled && (
          <CardContent>
            <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-800 border border-orange-200">
              ✅ Countdown timer is <strong>enabled</strong>. The website top
              bar will show:
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>
                  During live order window: &quot;🔴 Live Orders close in
                  HH:MM:SS&quot;
                </li>
                <li>
                  During pre-order window: &quot;📦 Pre-Orders close in
                  HH:MM:SS&quot;
                </li>
                <li>
                  When closed: &quot;⏳ Live Orders open at{" "}
                  {to12hr(settings.liveOrderStartTime)}&quot;
                </li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Delivery Slots Section */}
      <DeliverySlotCard
        slots={settings.deliverySlots || []}
        schedulingEnabled={settings.schedulingEnabled || false}
        onAddSlot={addSlot}
        onRemoveSlot={removeSlot}
        onToggleScheduling={(v) => update("schedulingEnabled", v)}
      />

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
