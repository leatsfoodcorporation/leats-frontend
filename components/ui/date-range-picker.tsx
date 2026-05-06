"use client";

import * as React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

type PresetType = 'last-week' | 'last-month' | 'last-3-months' | 'last-6-months' | 'last-year' | 'custom';

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<PresetType>('custom');
  const [showCalendar, setShowCalendar] = React.useState(false);

  const presets = [
    { label: 'Last Week', value: 'last-week' as PresetType },
    { label: 'Last Month', value: 'last-month' as PresetType },
    { label: 'Last 3 Months', value: 'last-3-months' as PresetType },
    { label: 'Last 6 Months', value: 'last-6-months' as PresetType },
    { label: 'Last Year', value: 'last-year' as PresetType },
    { label: 'Custom', value: 'custom' as PresetType },
  ];

  const getPresetDateRange = (preset: PresetType): DateRange | undefined => {
    const today = endOfDay(new Date());
    
    switch (preset) {
      case 'last-week':
        return { from: startOfDay(subDays(today, 7)), to: today };
      case 'last-month':
        return { from: startOfDay(subMonths(today, 1)), to: today };
      case 'last-3-months':
        return { from: startOfDay(subMonths(today, 3)), to: today };
      case 'last-6-months':
        return { from: startOfDay(subMonths(today, 6)), to: today };
      case 'last-year':
        return { from: startOfDay(subYears(today, 1)), to: today };
      case 'custom':
        return undefined;
      default:
        return undefined;
    }
  };

  const handlePresetClick = (preset: PresetType) => {
    setSelectedPreset(preset);
    
    if (preset === 'custom') {
      setShowCalendar(true);
    } else {
      const range = getPresetDateRange(preset);
      onDateRangeChange(range);
      setShowCalendar(false);
      setIsOpen(false);
    }
  };

  const handleSelect = (range: DateRange | undefined) => {
    onDateRangeChange(range);
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowCalendar(false);
  };

  const getDisplayText = () => {
    if (!dateRange?.from) return "Select date range";
    
    if (dateRange.to) {
      return `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`;
    }
    
    return format(dateRange.from, "MMM dd, yyyy");
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "justify-start text-left font-normal bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800",
              !dateRange && "text-slate-500 dark:text-slate-400"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-slate-600 dark:text-slate-400" />
            {getDisplayText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" align="start">
          <div className="flex">
            {/* Preset Filters Sidebar */}
            <div className="border-r border-slate-200 dark:border-slate-800 p-3 space-y-1 min-w-[140px]">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2">
                Quick Select
              </div>
              {presets.map((preset) => (
                <Button
                  key={preset.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePresetClick(preset.value)}
                  className={cn(
                    "w-full justify-start text-sm font-normal",
                    selectedPreset === preset.value
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Calendar Section */}
            {showCalendar && (
              <div className="relative">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleSelect}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date()}
                  className="rounded-md"
                />
                {dateRange?.from && dateRange?.to && (
                  <div className="border-t border-slate-200 dark:border-slate-800 p-3 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClose}
                      className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="h-4 w-4 mr-2 text-slate-600 dark:text-slate-400" />
                      Close
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Show message when no calendar is displayed */}
            {!showCalendar && (
              <div className="flex items-center justify-center p-8 text-sm text-slate-500 dark:text-slate-400">
                Select a preset or click Custom to choose dates
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
