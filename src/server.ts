import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import cors, { FastifyCorsOptions } from '@fastify/cors'
import { PrismaClient, $Enums } from '@prisma/client'
import bcrypt from 'bcrypt'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import jwtPlugin from '@fastify/jwt'
import { v4 as uuidv4 } from 'uuid'
import { sendInvite, sendPasswordResetEmail } from './services/email'
import { courtsRoutes } from './routes/api/courts'
import { membersRoutes } from './routes/api/members'
import { newsRoutes } from './routes/api/news'
import { bookingsRoutes } from './routes/api/bookings'
import { authRoutes } from './routes/api/auth'
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

// Password reset endpoints
app.post('/api/auth/forgot-password', async (request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) => {
  try {
    const { email } = request.body
    console.log('Processing forgot password request for email:', email)
    
    const user = await prisma.user.findUnique({ where: { email } })
    console.log('User found:', user ? 'yes' : 'no')

    if (!user) {
      // Don't reveal if the email exists or not
      return { message: 'If an account exists with this email, you will receive a password reset link.' }
    }

    // Generate a 6-digit token
    const token = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Hash the token before storing
    const hashedToken = await bcrypt.hash(token, 10)

    console.log('Creating reset token for user:', user.id)
    // Create reset token
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt,
      },
    })
    console.log('Reset token created:', resetToken.id)

    console.log('Sending reset email to:', email)
    // Send reset email with the original token
    await sendPasswordResetEmail(email, token)
    console.log('Reset email sent successfully')

    return { message: 'If an account exists with this email, you will receive a password reset link.' }
  } catch (error) {
    console.error('Forgot password error:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    reply.status(500).send({ error: 'Failed to process password reset request' })
  }
})

app.post('/api/auth/verify-reset-token', async (request: FastifyRequest<{ Body: { token: string } }>, reply: FastifyReply) => {
  try {
    const { token } = request.body
    const resetTokens = await prisma.passwordResetToken.findMany({
      where: {
        used: false,
        expiresAt: {
          gt: new Date(),
        },
        attempts: {
          lt: 3 // Maximum 3 attempts
        }
      },
      include: {
        user: true,
      },
    })

    // Find the matching token by comparing hashes
    const validToken = await Promise.all(
      resetTokens.map(async (resetToken) => {
        const isValid = await bcrypt.compare(token, resetToken.token)
        return isValid ? resetToken : null
      })
    ).then(tokens => tokens.find(token => token !== null))

    if (!validToken) {
      return reply.status(400).send({ error: 'Invalid or expired token' })
    }

    return { valid: true }
  } catch (error) {
    console.error('Verify reset token error:', error)
    reply.status(500).send({ error: 'Failed to verify reset token' })
  }
})

app.post('/api/auth/reset-password', async (request: FastifyRequest<{ Body: { token: string; password: string } }>, reply: FastifyReply) => {
  try {
    const { token, password } = request.body

    // Find all active reset tokens
    const resetTokens = await prisma.passwordResetToken.findMany({
      where: {
        used: false,
        expiresAt: {
          gt: new Date(),
        },
        attempts: {
          lt: 3 // Maximum 3 attempts
        }
      },
      include: {
        user: true,
      },
    })

    // Find the matching token by comparing hashes
    const validToken = await Promise.all(
      resetTokens.map(async (resetToken) => {
        const isValid = await bcrypt.compare(token, resetToken.token)
        return isValid ? resetToken : null
      })
    ).then(tokens => tokens.find(token => token !== null))

    if (!validToken) {
      // Increment attempt counter for all tokens that match the user
      if (resetTokens.length > 0) {
        await prisma.passwordResetToken.updateMany({
          where: {
            userId: resetTokens[0].userId,
            used: false,
            expiresAt: {
              gt: new Date(),
            }
          },
          data: {
            attempts: {
              increment: 1
            }
          }
        })
      }
      return reply.status(400).send({ error: 'Invalid or expired code' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: validToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: validToken.id },
        data: { used: true },
      }),
    ])

    return { message: 'Password has been reset successfully' }
  } catch (error) {
    console.error('Reset password error:', error)
    reply.status(500).send({ error: 'Failed to reset password' })
  }
})

// Start server
const start = async () => {
  try {
    console.log('Starting server with config:', {
      port: config.PORT,
      frontendUrl: config.FRONTEND_URL,
      nodeEnv: config.NODE_ENV
    })
    
    await app.listen({ port: config.PORT, host: '0.0.0.0' })
    console.log(`Server running at http://localhost:${config.PORT}`)
  } catch (err) {
    console.error('Error starting server:', err)
    if (err instanceof Error) {
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      })
    }
    process.exit(1)
  }
}

start() 