import { MembershipType, MemberStatus } from '@prisma/client'

export type CourtSurface = 'HARD' | 'CLAY' | 'GRASS' | 'ARTIFICIAL_GRASS'
export type CourtType = 'INDOOR' | 'OUTDOOR'
export type CourtStatus = 'ACTIVE' | 'MAINTENANCE' | 'CLOSED'

export interface Court {
  id: string
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

export interface News {
  id: string;
  title: string;
  content: string;
  published: boolean;
  author: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  User?: {
    name: string;
  };
}

export interface CreateNewsData {
  title: string;
  content: string;
  published?: boolean;
}

export interface UpdateNewsData {
  title?: string;
  content?: string;
  published?: boolean;
} 

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed'
export type BookingType = 'single' | 'double'

export interface Booking {
  id: string
  courtId: string
  memberId: string
  startTime: Date
  endTime: Date
  status: BookingStatus
  type: BookingType
  createdAt: Date
  updatedAt: Date
  court: Court
  member: {
    id: string
    name: string
    email: string
  }
}

export type BookingParticipantType = 'MEMBER_WITH_RIGHTS' | 'MEMBER_WITHOUT_RIGHTS' | 'NON_MEMBER' | 'GUEST'

export interface BookingParticipant {
  id: string
  bookingId: string
  name: string
  email?: string | null
  isMember: boolean
  memberId?: string | null
  member?: {
    id: string
    name: string
    email: string
    membershipType: MembershipType
    status: MemberStatus
  } | null
  type: BookingParticipantType
  createdAt: Date
  updatedAt: Date
}

export interface CreateBookingParticipantData {
  name: string
  email?: string
  memberId?: string
  type: BookingParticipantType
}

export interface UpdateBookingParticipantData {
  name?: string
  email?: string
  memberId?: string
  type?: BookingParticipantType
}

export interface BookingWithRelations extends Booking {
  court: Court
  member: {
    id: string
    name: string
    email: string
    membershipType: MembershipType
    status: MemberStatus
  }
  participants: BookingParticipant[]
}

export interface CreateBookingData {
  courtId: string
  memberId: string
  startTime: Date
  endTime: Date
  type?: BookingType
  participants: CreateBookingParticipantData[]
}

export interface UpdateBookingData {
  startTime?: Date
  endTime?: Date
  status?: BookingStatus
  type?: BookingType
  participants?: CreateBookingParticipantData[]
} 