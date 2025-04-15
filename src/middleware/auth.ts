import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import { $Enums } from '@prisma/client'
import { AuthUser } from '../types/fastify'

// Extend the FastifyRequest type to include our user object
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string
      role: $Enums.UserRole
    }
  }
}

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Skip auth for public routes
    if (request.url.startsWith('/api/auth/login') || 
        request.url.startsWith('/api/auth/register') ||
        request.url.startsWith('/api/auth/forgot-password') ||
        request.url.startsWith('/api/auth/verify-reset-token') ||
        request.url.startsWith('/api/auth/reset-password')) {
      return
    }

    // For /api/auth/me, we want to verify the token but not require it
    if (request.url.startsWith('/api/auth/me')) {
      try {
        await request.jwtVerify()
        const decoded = request.user as AuthUser
        
        if (!decoded || !decoded.userId) {
          return reply.status(401).send({ error: 'Invalid token payload' })
        }

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, role: true }
        })

        if (!user) {
          return reply.status(401).send({ error: 'User not found' })
        }

        request.user = {
          userId: user.id,
          role: user.role
        }
      } catch (error) {
        // If token verification fails, just continue without setting the user
        return
      }
      return
    }

    // For all other protected routes, require valid token
    await request.jwtVerify()
    const decoded = request.user as AuthUser
    
    if (!decoded || !decoded.userId) {
      return reply.status(401).send({ error: 'Invalid token payload' })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    })

    if (!user) {
      return reply.status(401).send({ error: 'User not found' })
    }

    request.user = {
      userId: user.id,
      role: user.role
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return reply.status(401).send({ error: 'Invalid token' })
  }
}

export function registerAuthMiddleware(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware)
} 