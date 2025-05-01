import { FastifyInstance } from 'fastify'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { authMiddleware } from '@/middleware/auth'

interface LoginBody {
  email: string
  password: string
}

interface RegisterBody {
  email: string
  password: string
  name?: string
}

export async function authRoutes(app: FastifyInstance) {
  // Login
  app.post<{ Body: LoginBody }>('/auth/login', async (request, reply) => {
    try {
      const { email, password } = request.body

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          memberProfile: true,
        },
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
          role: user.role,
          memberId: user.memberProfile?.id
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
      
      // Create user and member profile in a transaction
      const { user, member } = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role: 'MEMBER'
          }
        })

        const newMember = await tx.member.create({
          data: {
            name: name || email.split('@')[0],
            email,
            status: 'ACTIVE',
            membershipType: 'REGULAR',
            user: {
              connect: {
                id: newUser.id
              }
            }
          }
        })

        return { user: newUser, member: newMember }
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
          role: user.role,
          memberId: member.id
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

      const decoded = await request.server.jwt.verify<{ userId: string; role: string }>(token)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          memberProfile: true,
        },
      })

      if (!user) {
        return reply.send({ user: null })
      }

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          memberId: user.memberProfile?.id
        }
      })
    } catch (error) {
      console.error('Auth check error:', error)
      return reply.send({ user: null })
    }
  })
} 