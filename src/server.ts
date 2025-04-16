import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient, $Enums } from '@prisma/client'
import bcrypt from 'bcrypt'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import jwtPlugin from '@fastify/jwt'
import { v4 as uuidv4 } from 'uuid'
import { sendInvite, sendPasswordResetEmail } from './services/email'
import { courtsRoutes } from './routes/api/courts'
import { membersRoutes } from './routes/api/members'
import { registerAuthMiddleware } from './middleware/auth'

const prisma = new PrismaClient()
const app = Fastify()

// Register plugins
app.register(cors, {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})

app.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'your-cookie-secret-key',
  hook: 'onRequest',
  parseOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  }
})

app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
})

// Register JWT plugin
app.register(jwtPlugin, {
  secret: process.env.JWT_SECRET || 'your-super-secret-key-that-is-at-least-32-characters-long',
  cookie: {
    cookieName: 'accessToken',
    signed: false
  },
  sign: {
    expiresIn: '1d'
  },
  verify: {
    extractToken: (request) => {
      return request.cookies.accessToken
    }
  }
})

// Auth routes
app.post('/api/auth/register', async (request: FastifyRequest<{ Body: { email: string; password: string; name?: string } }>, reply: FastifyReply) => {
  try {
    const { email, password, name = '' } = request.body
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: $Enums.UserRole.MEMBER
      }
    })

    const token = await reply.jwtSign({ userId: user.id, role: user.role })
    reply.setCookie('accessToken', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    })
    
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role } }
  } catch (error) {
    reply.status(500).send({ error: 'Failed to register user' })
  }
})

app.post('/api/auth/login', async (request: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) => {
  try {
    const { email, password } = request.body
    console.log('Login attempt for email:', email)
    
    const user = await prisma.user.findUnique({ where: { email } })
    console.log('User found:', user ? 'yes' : 'no')
    
    if (!user) {
      console.log('User not found')
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    console.log('Password match:', passwordMatch)
    
    if (!passwordMatch) {
      console.log('Password does not match')
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const token = await reply.jwtSign({ userId: user.id, role: user.role })
    reply.setCookie('accessToken', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    })
    
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role } }
  } catch (error) {
    console.error('Login error:', error)
    reply.status(500).send({ error: 'Failed to login' })
  }
})

app.post('/api/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
  reply.clearCookie('accessToken', { 
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })
  return { message: 'Logged out successfully' }
})

// Add the /auth/me endpoint before auth middleware
app.get('/api/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // If there's no user set by the middleware, return null
    if (!request.user) {
      return { user: null }
    }

    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: { id: true, email: true, name: true, role: true }
    })

    if (!user) {
      return { user: null }
    }

    return { user }
  } catch (error) {
    console.error('Error in /api/auth/me:', error)
    return { user: null }
  }
})

// Register routes before auth middleware
app.register(courtsRoutes, { prefix: '/api' })
app.register(membersRoutes, { prefix: '/api' })

// Register auth middleware
registerAuthMiddleware(app)

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
    await app.listen({ port: 3000 })
    console.log('Server is running on port 3000')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start() 