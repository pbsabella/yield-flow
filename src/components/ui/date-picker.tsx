"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

interface DatePickerProps {
  id: string
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void // Allow undefined if user clears input
}

export function DatePicker({ id, selected, onSelect }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState<Date | undefined>(selected)
  const [value, setValue] = React.useState(formatDate(selected))

  // Sync internal string value when the external date object changes
  React.useEffect(() => {
    setValue(formatDate(selected))
    if (selected) setMonth(selected)
  }, [selected])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setValue(inputValue)

    const parsedDate = new Date(inputValue)
    if (isValidDate(parsedDate)) {
      onSelect(parsedDate)
      setMonth(parsedDate)
    } else if (inputValue === "") {
      onSelect(undefined)
    }
  }

  return (
    <InputGroup>
      <InputGroupInput
        id={id}
        value={value}
        placeholder="June 01, 2025"
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      />
      <InputGroupAddon align="inline-end">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <InputGroupButton
              variant="ghost"
              size="icon-xs"
              aria-label="Open calendar"
            >
              <CalendarIcon />
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selected}
              month={month}
              onMonthChange={setMonth}
              onSelect={(date) => {
                onSelect(date)
                setOpen(false)
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  )
}
