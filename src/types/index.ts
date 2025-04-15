export type CourtSurface = 'HARD' | 'CLAY' | 'GRASS' | 'ARTIFICIAL_GRASS'
export type CourtType = 'INDOOR' | 'OUTDOOR'
export type CourtStatus = 'ACTIVE' | 'MAINTENANCE' | 'CLOSED'

export interface Court {
  id: number
  name: string
  surface: string
  type: string
  status: string
  hasLights: boolean
  createdAt: Date
  updatedAt: Date
  lastMaintenance?: Date | null
  nextMaintenance?: Date | null
}

export interface CreateCourtData {
  name: string
  surface: string
  type: string
  status?: string
  hasLights?: boolean
}

export interface UpdateCourtData {
  name?: string
  surface?: string
  type?: string
  status?: string
  hasLights?: boolean
} 