"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Clock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AdvancedTimeRangePicker } from "./AdvancedTimePicker";

interface DeliverySlotCardProps {
  slots: string[];
  schedulingEnabled: boolean;
  onAddSlot: (slot: string) => void;
  onRemoveSlot: (index: number) => void;
  onToggleScheduling: (enabled: boolean) => void;
}

export function DeliverySlotCard({
  slots,
  schedulingEnabled,
  onAddSlot,
  onRemoveSlot,
  onToggleScheduling,
}: DeliverySlotCardProps) {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("21:00");

  const handleAdd = () => {
    // Helper to format 24h to 12h for the slot string
    const to12h = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      const period = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
    };

    const slotString = `${to12h(startTime)} - ${to12h(endTime)}`;
    onAddSlot(slotString);
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>Delivery Time Slots</CardTitle>
              <CardDescription>
                Define available time slots for delivery. Users will pick one
                of these during checkout.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Enable Scheduling</span>
            <Switch
              checked={schedulingEnabled}
              onCheckedChange={onToggleScheduling}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className={`space-y-6 ${!schedulingEnabled ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center bg-muted/40 p-5 rounded-xl border border-dashed shadow-sm">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">New Slot Time Range</span>
            <AdvancedTimeRangePicker
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />
          </div>
          <div className="flex-1 flex justify-end">
            <Button onClick={handleAdd} variant="secondary" className="gap-2 h-10 px-8 shadow-sm hover:translate-y-[-1px] transition-transform">
              <Plus className="h-4 w-4" /> Add Slot
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {slots && slots.length > 0 ? (
            slots.map((slot, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
              >
                <span className="font-medium text-sm">{slot}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveSlot(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center border-2 border-dashed rounded-lg text-muted-foreground text-sm">
              No delivery slots defined. Add your first slot above.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
