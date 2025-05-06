import { $Enums } from '@prisma/client'
import { User } from '@prisma/client'

declare module 'fastify' {
  interface FastifyRequest {
    user?: User
  }
}

export type UserRole = 'ADMIN' | 'STAFF' | 'MEMBER'

export interface AuthUser {
  userId: string
  role: UserRole
} 