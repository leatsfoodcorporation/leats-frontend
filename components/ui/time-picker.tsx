"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
  disabled?: boolean
  placeholder?: string
  description?: string
}

export function TimePicker({
  value,
  onChange,
  label,
  className = "",
  disabled = false,
  placeholder = "Select time",
  description,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [hours, setHours] = React.useState(() => value ? parseInt(value.split(":")[0]) : 0)
  const [minutes, setMinutes] = React.useState(() => value ? parseInt(value.split(":")[1]) : 0)

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    const formattedTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
    onChange(formattedTime)
  }

  const incrementHours = () => {
    const newHours = (hours + 1) % 24
    setHours(newHours)
    handleTimeChange(newHours, minutes)
  }

  const decrementHours = () => {
    const newHours = (hours - 1 + 24) % 24
    setHours(newHours)
    handleTimeChange(newHours, minutes)
  }

  const incrementMinutes = () => {
    const newMinutes = (minutes + 15) % 60
    setMinutes(newMinutes)
    handleTimeChange(hours, newMinutes)
  }

  const decrementMinutes = () => {
    const newMinutes = (minutes - 15 + 60) % 60
    setMinutes(newMinutes)
    handleTimeChange(hours, newMinutes)
  }

  const displayValue = value
    ? new Date(2025, 0, 1, hours, minutes).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    : placeholder

  return (
    <div className={cn("relative space-y-1", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {description && (
            <span className="text-sm text-muted-foreground"> - {description}</span>
          )}
        </Label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <Clock className="mr-2 h-4 w-4" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="grid gap-4 p-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={incrementHours}
                  className="h-8 w-8"
                >
                  ▲
                </Button>
                <div className="w-12 text-center py-2 text-lg">
                  {String(hours).padStart(2, '0')}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={decrementHours}
                  className="h-8 w-8"
                >
                  ▼
                </Button>
              </div>
              <div className="text-2xl">:</div>
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={incrementMinutes}
                  className="h-8 w-8"
                >
                  ▲
                </Button>
                <div className="w-12 text-center py-2 text-lg">
                  {String(minutes).padStart(2, '0')}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={decrementMinutes}
                  className="h-8 w-8"
                >
                  ▼
                </Button>
              </div>
            </div>
            <div className="flex justify-between border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  const now = new Date()
                  setHours(now.getHours())
                  setMinutes(Math.floor(now.getMinutes() / 15) * 15)
                  handleTimeChange(now.getHours(), Math.floor(now.getMinutes() / 15) * 15)
                  setIsOpen(false)
                }}
              >
                Now
              </Button>
              <Button
                onClick={() => {
                  handleTimeChange(hours, minutes)
                  setIsOpen(false)
                }}
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        value={value}
        onChange={(e) => {
          const [newHours, newMinutes] = e.target.value.split(":").map(Number)
          setHours(newHours)
          setMinutes(newMinutes)
          onChange(e.target.value)
        }}
        className="hidden"
      />
    </div>
  )
}
