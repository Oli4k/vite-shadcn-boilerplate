import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

function HSLToRGB(h: number, s: number, l: number) {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [255 * f(0), 255 * f(8), 255 * f(4)]
}

function RGBToHSL(r: number, g: number, b: number) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return [h * 360, s * 100, l * 100]
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [color, setColor] = useState(() => {
    const [h, s, l] = value.split(" ").map(parseFloat)
    return { h, s, l }
  })

  const [isDragging, setIsDragging] = useState(false)
  const [activeType, setActiveType] = useState<"hue" | "saturation" | "lightness" | null>(null)
  const sliderRef = React.useRef<HTMLDivElement | null>(null)

  const handleChange = useCallback(
    (newColor: { h: number; s: number; l: number }) => {
      setColor(newColor)
      onChange(`${newColor.h.toFixed(1)} ${newColor.s.toFixed(1)}% ${newColor.l.toFixed(1)}%`)
    },
    [onChange]
  )

  const handleMouseDown = (
    event: React.MouseEvent<HTMLDivElement>,
    type: "hue" | "saturation" | "lightness"
  ) => {
    event.preventDefault()
    setIsDragging(true)
    setActiveType(type)
    sliderRef.current = event.currentTarget
    handleColorChange(event)
  }

  const handleColorChange = useCallback((event: MouseEvent | React.MouseEvent) => {
    if (!sliderRef.current || !activeType) return

    const rect = sliderRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))

    switch (activeType) {
      case "hue":
        handleChange({ ...color, h: (percentage * 360) / 100 })
        break
      case "saturation":
        handleChange({ ...color, s: percentage })
        break
      case "lightness":
        handleChange({ ...color, l: percentage })
        break
    }
  }, [activeType, color, handleChange])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isDragging) {
      handleColorChange(event)
    }
  }, [isDragging, handleColorChange])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setActiveType(null)
    sliderRef.current = null
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[220px] justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="w-full flex items-center gap-2">
            <div
              className="h-4 w-4 rounded !bg-none"
              style={{ backgroundColor: `hsl(${value})` }}
            />
            <div className="truncate flex-1">HSL({value})</div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Hue</div>
              <div className="text-sm text-muted-foreground">{color.h.toFixed(1)}°</div>
            </div>
            <div
              className="h-4 rounded-md cursor-pointer"
              style={{
                background:
                  "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
              }}
              onMouseDown={(e) => handleMouseDown(e, "hue")}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Saturation</div>
              <div className="text-sm text-muted-foreground">{color.s.toFixed(1)}%</div>
            </div>
            <div
              className="h-4 rounded-md cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(${color.h}, 0%, ${color.l}%), hsl(${color.h}, 100%, ${color.l}%))`,
              }}
              onMouseDown={(e) => handleMouseDown(e, "saturation")}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Lightness</div>
              <div className="text-sm text-muted-foreground">{color.l.toFixed(1)}%</div>
            </div>
            <div
              className="h-4 rounded-md cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(${color.h}, ${color.s}%, 0%), hsl(${color.h}, ${color.s}%, 50%), hsl(${color.h}, ${color.s}%, 100%))`,
              }}
              onMouseDown={(e) => handleMouseDown(e, "lightness")}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 