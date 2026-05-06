"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { type OrderScheduleSettings } from "@/services/orderScheduleService";
import { AdvancedTimePicker } from "./AdvancedTimePicker";

interface TimeWindowCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  windowLabel: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
  isActive: boolean;
  onUpdate: (key: keyof OrderScheduleSettings, value: string | boolean) => void;
  enabledKey: keyof OrderScheduleSettings;
  labelKey: keyof OrderScheduleSettings;
  startTimeKey: keyof OrderScheduleSettings;
  endTimeKey: keyof OrderScheduleSettings;
  to12hr: (t: string) => string;
  accentColor: string;
  activeLabel: string;
}

export function TimeWindowCard({
  title,
  description,
  icon,
  windowLabel,
  startTime,
  endTime,
  enabled,
  isActive,
  onUpdate,
  enabledKey,
  labelKey,
  startTimeKey,
  endTimeKey,
  to12hr,
  accentColor,
  activeLabel,
}: TimeWindowCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={accentColor}>{icon}</div>
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={`gap-1 ${isActive ? "bg-green-600 hover:bg-green-700" : ""}`}
            >
              {isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {isActive ? `${activeLabel} — ACTIVE` : "Inactive"}
            </Badge>
            <Switch
              checked={enabled}
              onCheckedChange={(v) => onUpdate(enabledKey, v)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className={`space-y-4 ${!enabled ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Window Label</Label>
            <Input
              value={windowLabel}
              onChange={(e) => onUpdate(labelKey, e.target.value)}
              placeholder="e.g. Live Order"
            />
          </div>
          <div className="space-y-2">
            <Label>Start Time</Label>
            <AdvancedTimePicker
              value={startTime}
              onChange={(v) => onUpdate(startTimeKey, v)}
              disabled={!enabled}
            />
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <AdvancedTimePicker
              value={endTime}
              onChange={(v) => onUpdate(endTimeKey, v)}
              disabled={!enabled}
            />
          </div>
        </div>
        <div className={`rounded-lg p-3 text-sm border ${accentColor.replace('text-', 'bg-').replace('-600', '-50')} ${accentColor.replace('text-', 'text-').replace('-600', '-800')} ${accentColor.replace('text-', 'border-').replace('-600', '-200')}`}>
          <strong>Window:</strong> {to12hr(startTime)} → {to12hr(endTime)}
        </div>
      </CardContent>
    </Card>
  );
}
