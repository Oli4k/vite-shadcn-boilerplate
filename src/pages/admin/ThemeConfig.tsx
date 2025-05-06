import { useTheme } from "@/components/theme-provider"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ColorPicker } from "@/components/ui/color-picker"

type ColorConfig = {
  [key: string]: {
    label: string
    value: string
    description?: string
  }
}

const defaultColors: ColorConfig = {
  primary: {
    label: "Primary Color",
    value: "221.2 83.2% 53.3%",
    description: "Main brand color used for buttons and important elements"
  },
  secondary: {
    label: "Secondary Color",
    value: "210 40% 96.1%",
    description: "Used for less prominent elements and backgrounds"
  },
  accent: {
    label: "Accent Color",
    value: "210 40% 96.1%",
    description: "Highlights and accents throughout the interface"
  },
  background: {
    label: "Background Color",
    value: "0 0% 100%",
    description: "Main background color of the application"
  },
  foreground: {
    label: "Foreground Color",
    value: "222.2 84% 4.9%",
    description: "Main text color"
  }
}

export function ThemeConfig() {
  const { theme } = useTheme()
  const [colors, setColors] = useState<ColorConfig>(defaultColors)
  const [originalColors, setOriginalColors] = useState<ColorConfig>(defaultColors)

  useEffect(() => {
    // Load current colors from CSS variables
    const root = document.documentElement
    const currentColors = { ...colors }
    
    Object.keys(currentColors).forEach(key => {
      const value = getComputedStyle(root).getPropertyValue(`--${key}`).trim()
      if (value) {
        currentColors[key] = {
          ...currentColors[key],
          value
        }
      }
    })
    
    setColors(currentColors)
    setOriginalColors(currentColors)
  }, [])

  const handleColorChange = (colorKey: string, value: string) => {
    setColors(prev => ({
      ...prev,
      [colorKey]: {
        ...prev[colorKey],
        value
      }
    }))
  }

  const applyColors = () => {
    const root = document.documentElement
    
    Object.entries(colors).forEach(([key, config]) => {
      root.style.setProperty(`--${key}`, config.value)
      
      // If we're setting a dark theme color, also update the dark theme variable
      if (theme === 'dark') {
        root.style.setProperty(`--${key}-dark`, config.value)
      }
    })
    
    toast.success("Theme colors updated successfully")
  }

  const resetColors = () => {
    setColors(originalColors)
    const root = document.documentElement
    
    Object.entries(originalColors).forEach(([key, config]) => {
      root.style.setProperty(`--${key}`, config.value)
    })
    
    toast.success("Theme colors reset to defaults")
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            {Object.entries(colors).map(([key, config]) => (
              <div key={key} className="grid gap-2">
                <Label htmlFor={key}>
                  {config.label}
                  {config.description && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      {config.description}
                    </span>
                  )}
                </Label>
                <div className="flex gap-4 items-center">
                  <ColorPicker
                    value={config.value}
                    onChange={(value) => handleColorChange(key, value)}
                  />
                  <div 
                    className="w-10 h-10 rounded border"
                    style={{ 
                      backgroundColor: `hsl(${config.value})`,
                      border: '1px solid var(--border)' 
                    }}
                  />
                </div>
              </div>
            ))}
            
            <div className="flex gap-4 mt-6">
              <Button onClick={applyColors}>
                Apply Changes
              </Button>
              <Button variant="outline" onClick={resetColors}>
                Reset to Defaults
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 