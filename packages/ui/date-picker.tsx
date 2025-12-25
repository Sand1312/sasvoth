"use client"

import * as React from "react"
import { CalendarIcon, X } from "lucide-react"

import { cn } from "./lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

interface DatePickerProps {
  date: Date | undefined
  onSelect: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

function formatDateDisplay(date: Date | undefined) {
  if (!date) {
    return ""
  }
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState<Date | undefined>(date)

  // Sync month with date when date changes externally
  React.useEffect(() => {
    if (date) {
      setMonth(date)
    }
  }, [date])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative inline-block">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            data-empty={!date}
            className={cn(
              "w-[200px] justify-start text-left font-normal data-[empty=true]:text-muted-foreground pr-10",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? formatDateDisplay(date) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        {date && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 opacity-50 hover:opacity-100"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onSelect(undefined)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          captionLayout="dropdown"
          month={month}
          onMonthChange={setMonth}
          onSelect={(selectedDate) => {
            onSelect(selectedDate)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

DatePicker.displayName = "DatePicker"

export { DatePicker }
export type { DatePickerProps }
