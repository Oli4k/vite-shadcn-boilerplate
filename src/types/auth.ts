import { $Enums } from '@prisma/client'

export type UserRole = 'ADMIN' | 'STAFF' | 'MEMBER'

export interface AuthUser {
  userId: string
  role: UserRole
} 