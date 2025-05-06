import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import cors, { FastifyCorsOptions } from '@fastify/cors'
import { PrismaClient } from '@prisma/client'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import jwtPlugin from '@fastify/jwt'
import { courtsRoutes } from './routes/api/courts'
import { membersRoutes } from './routes/api/members'
import { newsRoutes } from './routes/api/news'
import { bookingsRoutes } from './routes/api/bookings'
import { authRoutes } from './routes/api/auth'
import { dashboardRoutes } from './routes/api/dashboard'
import { registerAuthMiddleware } from './middleware/auth'
import { config } from './config'

const prisma = new PrismaClient()
const app = Fastify({
  logger: true // Enable logging to help debug issues
})

// Register plugins
app.register(cors, {
  origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      cb(null, true)
      return
    }

    // In production, check against allowed origins
    const allowedOrigins = [
      config.FRONTEND_URL,
      'http://localhost:5173',
      'https://localhost:5173',
      'http://127.0.0.1:5173',
      'https://127.0.0.1:5173',
      /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/  // Allow HTTP/HTTPS local network IPs
    ]
    
    if (!origin) {
      cb(null, true)
      return
    }

    // Check against exact matches and patterns
    const isAllowed = allowedOrigins.some(allowed => 
      typeof allowed === 'string' 
        ? allowed === origin
        : allowed.test(origin)
    )

    if (isAllowed) {
      cb(null, true)
      return
    }

    cb(new Error('Not allowed by CORS'), false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
} as FastifyCorsOptions)

app.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'your-cookie-secret-key',
  hook: 'onRequest',
  parseOptions: {
    httpOnly: true,
    secure: false, // Allow non-HTTPS in development
    sameSite: 'lax',  // More permissive SameSite setting
    path: '/',
  }
})

app.register(jwtPlugin, {
  secret: process.env.JWT_SECRET || 'your-jwt-secret-key'
})

app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
})

// Register auth middleware
registerAuthMiddleware(app)

// Register routes
app.register(authRoutes, { prefix: '/api' })
app.register(courtsRoutes, { prefix: '/api' })
app.register(membersRoutes, { prefix: '/api' })
app.register(newsRoutes, { prefix: '/api' })
app.register(bookingsRoutes, { prefix: '/api' })
app.register(dashboardRoutes, { prefix: '/api' })

// In development, proxy non-API requests to Vite dev server
if (process.env.NODE_ENV === 'development') {
  app.register(import('@fastify/http-proxy'), {
    upstream: 'http://localhost:5173',
    prefix: '/',
    rewritePrefix: '/',
    websocket: true,
    preHandler: (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
      // Skip proxying for API routes
      if (request.url.startsWith('/api/')) {
        reply.callNotFound()
        return
      }
      done()
    }
  })
}

// Migration endpoint to create member profiles for existing users
app.post('/api/migrate/create-member-profiles', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Find all users without member profiles
    const usersWithoutMembers = await prisma.user.findMany({
      where: {
        memberProfile: null,
        role: 'MEMBER'
      }
    })

    // Create member profiles for each user
    const createdMembers = await Promise.all(
      usersWithoutMembers.map(user =>
        prisma.member.create({
          data: {
            name: user.name || user.email.split('@')[0],
            email: user.email,
            status: 'ACTIVE',
            membershipType: 'REGULAR',
            user: {
              connect: {
                id: user.id
              }
            }
          }
        })
      )
    )

    return {
      success: true,
      message: `Created ${createdMembers.length} member profiles`,
      members: createdMembers
    }
  } catch (error) {
    console.error('Migration error:', error)
    return reply.status(500).send({
      success: false,
      error: 'Failed to create member profiles'
    })
  }
})

const start = async () => {
  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' })
    console.log(`Server listening on port ${config.PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start() 