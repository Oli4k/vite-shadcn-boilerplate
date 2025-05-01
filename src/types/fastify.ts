import { $Enums } from '@prisma/client'

export interface AuthUser {
  userId: string
  role: $Enums.UserRole
  memberId?: string
} 