"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { Clock, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "start", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-auto rounded-xl border bg-popover p-3 text-popover-foreground shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

interface TimeOption {
  value: number;
  label: string;
}

// Convert 24h "HH:mm" to 12h state
function parse24h(timeStr: string) {
  if (!timeStr) return { hour: 12, minute: 0, period: "AM" };
  const [h24, m] = timeStr.split(":").map(Number);
  const period = h24 >= 12 ? "PM" : "AM";
  const hour = h24 % 12 || 12;
  return { hour, minute: m || 0, period };
}

// Convert 12h state to 24h "HH:mm"
function to24h(hour: number, minute: number, period: string) {
  let h24 = hour;
  if (period === "PM" && hour !== 12) h24 += 12;
  if (period === "AM" && hour === 12) h24 = 0;
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// Format 12h state for display
function format12h(hour: number, minute: number, period: string) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
}

interface AdvancedTimePickerProps {
  value?: string; // "HH:mm"
  onChange?: (time: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function AdvancedTimePicker({
  value = "12:00",
  onChange,
  disabled = false,
  placeholder = "Select time",
  className,
}: AdvancedTimePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parse24h(value), [value]);
  const [tempHour, setTempHour] = useState(parsed.hour);
  const [tempMinute, setTempMinute] = useState(parsed.minute);
  const [tempPeriod, setTempPeriod] = useState(parsed.period);

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  // Update internal temp state when value changes externally (only if closed)
  useEffect(() => {
    if (!open) {
      setTempHour(parsed.hour);
      setTempMinute(parsed.minute);
      setTempPeriod(parsed.period);
    }
  }, [value, parsed, open]);

  // Handle scrolling when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        hourRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        minuteRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        periodRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }
  }, [open]);

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);
  const periods = ["AM", "PM"];

  const handleSelect = (h: number, m: number, p: string) => {
    const newVal = to24h(h, m, p);
    if (onChange) onChange(newVal);
  };

  const display = format12h(parsed.hour, parsed.minute, parsed.period);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex h-10 w-full sm:w-auto min-w-[130px] items-center justify-between font-normal px-3",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 opacity-50" />
            {display || placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 overflow-hidden border-none shadow-2xl">
        <div className="flex p-3 gap-1 bg-background rounded-xl border">
          {/* Hour Column */}
          <ScrollArea className="h-[200px] w-[60px]">
            <div className="flex flex-col gap-1 pr-2">
              {hours.map((h) => (
                <div key={h} ref={h === tempHour ? hourRef : null}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-10 rounded-lg text-sm transition-all",
                      h === tempHour 
                        ? "bg-secondary font-bold text-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    onClick={() => {
                      setTempHour(h);
                      handleSelect(h, tempMinute, tempPeriod);
                    }}
                  >
                    {String(h).padStart(2, "0")}
                  </Button>
                </div>
              ))}
              <div className="h-20" /> {/* Spacer for easier scrolling to bottom items */}
            </div>
          </ScrollArea>

          <div className="w-[1px] bg-border my-2" />

          {/* Minute Column */}
          <ScrollArea className="h-[200px] w-[60px]">
            <div className="flex flex-col gap-1 px-2">
              {minutes.map((m) => (
                <div key={m} ref={m === tempMinute ? minuteRef : null}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-10 rounded-lg text-sm transition-all",
                      m === tempMinute 
                        ? "bg-secondary font-bold text-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    onClick={() => {
                      setTempMinute(m);
                      handleSelect(tempHour, m, tempPeriod);
                    }}
                  >
                    {String(m).padStart(2, "0")}
                  </Button>
                </div>
              ))}
              <div className="h-20" />
            </div>
          </ScrollArea>

          <div className="w-[1px] bg-border my-2" />

          {/* Period Column */}
          <div className="flex flex-col gap-1 pl-2 justify-center pb-20">
            {periods.map((p) => (
              <Button
                key={p}
                variant="ghost"
                className={cn(
                  "w-[60px] h-10 rounded-lg text-sm transition-all",
                  p === tempPeriod 
                    ? "bg-secondary font-bold text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={() => {
                  setTempPeriod(p);
                  handleSelect(tempHour, tempMinute, p);
                }}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface AdvancedTimeRangePickerProps {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  disabled?: boolean;
}

export function AdvancedTimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled = false,
}: AdvancedTimeRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <AdvancedTimePicker
        value={startTime}
        onChange={onStartTimeChange}
        disabled={disabled}
        placeholder="Start"
      />
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
      <AdvancedTimePicker
        value={endTime}
        onChange={onEndTimeChange}
        disabled={disabled}
        placeholder="End"
      />
    </div>
  );
}
