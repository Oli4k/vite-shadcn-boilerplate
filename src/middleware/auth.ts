import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@/lib/prisma'
import { AuthUser } from '@/types/fastify'

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Skip auth for public routes
    if (
      request.url === '/api/auth/login' ||
      request.url === '/api/auth/register' ||
      request.url === '/api/auth/logout' ||
      request.url === '/api/auth/me' ||
      request.url === '/api/auth/forgot-password' ||
      request.url === '/api/auth/verify-reset-token' ||
      request.url === '/api/auth/reset-password' ||
      request.url.startsWith('/api/news/public')
    ) {
      return
    }

    const token = request.cookies.accessToken
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    try {
      const decoded = await request.server.jwt.verify<{ userId: string; role: string }>(token)
      
      // Get user
      const user = await prisma.user.findUnique({
        where: {
          id: decoded.userId
        }
      })

      if (!user) {
        return reply.status(401).send({ error: 'User not found' })
      }

      // Attach user data to request
      request.user = {
        userId: user.id,
        role: user.role
      }
    } catch (err) {
      return reply.status(401).send({ error: 'Invalid token' })
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

export function registerAuthMiddleware(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)
} 