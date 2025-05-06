import { FastifyInstance } from 'fastify'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { authMiddleware } from '@/middleware/auth'
import { sendPasswordResetEmail } from '@/services/email'
import { UserRole } from '@prisma/client'
import crypto from 'crypto'

interface LoginBody {
  email: string
  password: string
}

interface RegisterBody {
  email: string
  password: string
  name?: string
}

interface JwtPayload {
  userId: string;
  role: UserRole;
}

export async function authRoutes(app: FastifyInstance) {
  // Login
  app.post<{ Body: LoginBody }>('/auth/login', async (request, reply) => {
    try {
      const { email, password } = request.body

      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' })
      }

      const validPassword = await bcrypt.compare(password, user.password)
      if (!validPassword) {
        return reply.status(401).send({ error: 'Invalid credentials' })
      }

      const token = await reply.jwtSign({ userId: user.id, role: user.role })
      
      reply.setCookie('accessToken', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 1 day
      })

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      })
    } catch (error) {
      console.error('Login error:', error)
      return reply.status(500).send({ error: 'Failed to login' })
    }
  })

  // Register
  app.post<{ Body: RegisterBody }>('/auth/register', async (request, reply) => {
    try {
      const { email, password, name = '' } = request.body
      const hashedPassword = await bcrypt.hash(password, 10)
      
      const user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email,
          password: hashedPassword,
          name,
          role: UserRole.MEMBER,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const token = await reply.jwtSign({ userId: user.id, role: user.role })
      
      reply.setCookie('accessToken', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 1 day
      })

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      })
    } catch (error) {
      console.error('Registration error:', error)
      return reply.status(500).send({ error: 'Failed to register user' })
    }
  })

  // Logout
  app.post('/auth/logout', async (request, reply) => {
    reply.clearCookie('accessToken')
    return reply.send({ success: true })
  })

  // Get current user
  app.get('/auth/me', async (request, reply) => {
    try {
      const token = request.cookies.accessToken
      if (!token) {
        return reply.send({ user: null })
      }

      const decoded = await request.server.jwt.verify<JwtPayload>(token)
      const userId = decoded.userId
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return reply.send({ user: null })
      }

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      })
    } catch (error) {
      console.error('Auth check error:', error)
      return reply.send({ user: null })
    }
  })

  // Forgot password
  app.post<{ Body: { email: string } }>('/auth/forgot-password', async (request, reply) => {
    try {
      const { email } = request.body
      console.log('Processing forgot password request for email:', email)
      
      const user = await prisma.user.findUnique({ where: { email } })
      console.log('User found:', user ? 'yes' : 'no')

      if (!user) {
        // Don't reveal if the email exists or not
        return reply.send({ message: 'If an account exists with this email, you will receive a password reset link.' })
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

      return reply.send({ message: 'If an account exists with this email, you will receive a password reset link.' })
    } catch (error) {
      console.error('Forgot password error:', error)
      return reply.status(500).send({ error: 'Failed to process password reset request' })
    }
  })

  // Reset password
  app.post<{ Body: { email: string; token: string; newPassword: string } }>('/auth/reset-password', async (request, reply) => {
    try {
      const { email, token, newPassword } = request.body

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        return reply.status(400).send({ error: 'Invalid reset request' })
      }

      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          userId: user.id,
          used: false,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (!resetToken) {
        return reply.status(400).send({ error: 'Invalid or expired reset token' })
      }

      const validToken = await bcrypt.compare(token, resetToken.token)
      if (!validToken) {
        // Increment attempts counter
        await prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { attempts: { increment: 1 } }
        })
        return reply.status(400).send({ error: 'Invalid reset token' })
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Update password and mark token as used in a transaction
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        }),
        prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { used: true }
        })
      ])

      return reply.send({ message: 'Password has been reset successfully' })
    } catch (error) {
      console.error('Reset password error:', error)
      return reply.status(500).send({ error: 'Failed to reset password' })
    }
  })
} 