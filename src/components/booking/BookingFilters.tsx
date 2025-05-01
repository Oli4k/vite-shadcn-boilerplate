import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { CircleDot, Lightbulb, Umbrella, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface BookingFiltersProps {
  surfaceTypes: string[]
  selectedSurfaces: string[]
  onSurfaceChange: (surface: string) => void
  amenities: {
    lighting?: boolean
    covered?: boolean
    indoor?: boolean
  }
  onAmenityChange: (amenity: keyof typeof amenities) => void
}

export function BookingFilters({
  surfaceTypes,
  selectedSurfaces,
  onSurfaceChange,
  amenities = {},
  onAmenityChange
}: BookingFiltersProps) {
  const amenityConfig = {
    lighting: {
      label: "Lighting",
      icon: Lightbulb,
      description: "Courts with lighting available"
    },
    covered: {
      label: "Covered",
      icon: Umbrella,
      description: "Weather protected courts"
    },
    indoor: {
      label: "Indoor",
      icon: Shield,
      description: "Indoor facilities"
    }
  } as const

  return (
    <Card>
      <CardContent className="p-4 space-y-6">
        <div className="space-y-4">
          <Label className="text-sm font-medium">Surface Type</Label>
          <div className="space-y-2">
            {surfaceTypes.map((surface) => (
              <div
                key={surface}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={`surface-${surface}`}
                  checked={selectedSurfaces.includes(surface)}
                  onCheckedChange={() => onSurfaceChange(surface)}
                />
                <Label
                  htmlFor={`surface-${surface}`}
                  className="flex items-center gap-1.5 text-sm cursor-pointer"
                >
                  <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
                  {surface}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-medium">Amenities</Label>
          <div className="space-y-2">
            {(Object.keys(amenityConfig) as Array<keyof typeof amenityConfig>).map((key) => {
              const { label, icon: Icon, description } = amenityConfig[key]
              return (
                <div
                  key={key}
                  className="flex items-start space-x-2"
                >
                  <Checkbox
                    id={`amenity-${key}`}
                    checked={amenities[key]}
                    onCheckedChange={() => onAmenityChange(key)}
                    disabled={key !== 'lighting'} // Temporarily disable non-lighting amenities
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={`amenity-${key}`}
                      className="flex items-center gap-1.5 text-sm cursor-pointer"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 