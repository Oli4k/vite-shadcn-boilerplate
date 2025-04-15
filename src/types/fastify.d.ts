import '@fastify/jwt'
import { $Enums } from '@prisma/client'

export interface AuthUser {
  userId: string
  role: $Enums.UserRole
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser
    user: AuthUser
  }
} 