import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import { v4 as uuidv4 } from 'uuid'
import { sendInvite } from './services/email'

type UserRole = 'ADMIN' | 'STAFF' | 'MEMBER'
type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
type MembershipType = 'REGULAR' | 'PREMIUM' | 'VIP'

const prisma = new PrismaClient()
const app = Fastify()

// Register plugins
app.register(cors, {
  origin: process.env.NODE_ENV === 'production' 
    ? 'http://localhost:5173' 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
app.register(cookie)
app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key'

// Helper function to generate tokens
function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' })
  return { accessToken, refreshToken }
}

// Auth routes
app.post('/api/auth/register', async (request: FastifyRequest<{
  Body: {
    email: string
    password: string
    name?: string | null
    role?: UserRole
  }
}>, reply: FastifyReply) => {
  const { email, password, name, role } = request.body

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log('Registration failed: Email already exists', { email })
      reply.status(400).send({ message: 'Email already exists' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: role || 'MEMBER',
      },
    })

    console.log('User created successfully:', { userId: user.id, email: user.email })

    const { accessToken, refreshToken } = generateTokens(user.id)

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    })

    reply.send({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    })
  } catch (error) {
    console.error('Registration error:', error)
    reply.status(500).send({ message: 'Error during registration' })
  }
})

app.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body as { email: string; password: string }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    reply.status(401).send({ message: 'Invalid credentials' })
    return
  }

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    reply.status(401).send({ message: 'Invalid credentials' })
    return
  }

  const { accessToken, refreshToken } = generateTokens(user.id)

  reply.setCookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  })

  reply.send({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken,
  })
})

app.post('/api/auth/refresh', async (request, reply) => {
  const refreshToken = request.cookies.refreshToken

  if (!refreshToken) {
    reply.status(401).send({ message: 'No refresh token' })
    return
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })

    if (!user) {
      reply.status(401).send({ message: 'User not found' })
      return
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id)

    reply.setCookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    })

    reply.send({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    })
  } catch (error) {
    reply.status(401).send({ message: 'Invalid refresh token' })
  }
})

app.post('/api/auth/logout', async (request, reply) => {
  reply.clearCookie('refreshToken', {
    path: '/',
  })
  reply.send({ message: 'Logged out successfully' })
})

// Protected route example
app.get('/api/auth/me', async (request, reply) => {
  const token = request.headers.authorization?.split(' ')[1]

  if (!token) {
    reply.status(401).send({ message: 'No token provided' })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    if (!user) {
      reply.status(401).send({ message: 'User not found' })
      return
    }

    reply.send(user)
  } catch (error) {
    reply.status(401).send({ message: 'Invalid token' })
  }
})

// Member routes
app.get('/api/members', async (request: FastifyRequest, reply: FastifyReply) => {
  const token = request.headers.authorization?.split(' ')[1]

  if (!token) {
    reply.status(401).send({ message: 'No token provided' })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })

    if (!user) {
      reply.status(401).send({ message: 'User not found' })
      return
    }

    const members = await prisma.member.findMany({
      include: {
        managedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    reply.send(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    reply.status(500).send({ message: 'Failed to fetch members' })
  }
})

app.post('/api/members', async (request: FastifyRequest<{
  Body: {
    name: string
    email: string
    phone?: string | null
    address?: string | null
    membershipType?: MembershipType
    status?: MemberStatus
    notes?: string | null
  }
}>, reply: FastifyReply) => {
  const token = request.headers.authorization?.split(' ')[1]

  if (!token) {
    reply.status(401).send({ message: 'No token provided' })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })

    if (!user) {
      reply.status(401).send({ message: 'User not found' })
      return
    }

    const { name, email, phone, address, membershipType, status, notes } = request.body

    if (!name || !email) {
      reply.status(400).send({ message: 'Name and email are required' })
      return
    }

    const member = await prisma.member.create({
      data: {
        name,
        email,
        phone,
        address,
        membershipType: membershipType || 'REGULAR',
        status: status || 'PENDING',
        notes,
        managedById: user.id,
      },
      include: {
        managedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    reply.status(201).send(member)
  } catch (error) {
    console.error('Error creating member:', error)
    if (error.code === 'P2002') {
      reply.status(400).send({ message: 'Email already exists' })
    } else {
      reply.status(500).send({ message: 'Failed to create member' })
    }
  }
})

app.get('/api/members/:id', async (request: FastifyRequest<{
  Params: {
    id: string
  }
}>, reply: FastifyReply) => {
  const token = request.headers.authorization?.split(' ')[1]

  if (!token) {
    reply.status(401).send({ message: 'No token provided' })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })

    if (!user) {
      reply.status(401).send({ message: 'User not found' })
      return
    }

    const { id } = request.params

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        managedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!member) {
      reply.status(404).send({ message: 'Member not found' })
      return
    }

    reply.send(member)
  } catch (error) {
    console.error('Error fetching member:', error)
    reply.status(500).send({ message: 'Error fetching member' })
  }
})

app.put('/api/members/:id', async (request: FastifyRequest<{
  Params: {
    id: string
  },
  Body: {
    name?: string
    email?: string
    phone?: string | null
    address?: string | null
    membershipType?: MembershipType
    status?: MemberStatus
    managedById?: string | null
  }
}>, reply: FastifyReply) => {
  const token = request.headers.authorization?.split(' ')[1]

  if (!token) {
    reply.status(401).send({ message: 'No token provided' })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })

    if (!user) {
      reply.status(401).send({ message: 'User not found' })
      return
    }

    const { id } = request.params

    // If user is staff, check if they manage this member
    if (user.role === 'STAFF') {
      const member = await prisma.member.findFirst({
        where: {
          id,
          managedById: user.id,
        },
      })
      if (!member) {
        reply.status(403).send({ message: 'Access denied' })
        return
      }
    }

    const { name, email, phone, address, membershipType, status, managedById } = request.body

    const member = await prisma.member.update({
      where: { id },
      data: {
        name,
        email,
        phone: phone || null,
        address: address || null,
        membershipType,
        status,
        managedById: managedById || null,
      } as Prisma.MemberUpdateInput,
      include: {
        managedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: true,
      },
    })

    reply.send(member)
  } catch (error: any) {
    if (error.code === 'P2002') {
      reply.status(400).send({ message: 'Email already exists' })
    } else {
      console.error('Error updating member:', error)
      reply.status(500).send({ message: 'Error updating member' })
    }
  }
})

app.delete('/api/members/:id', async (request, reply) => {
  const token = request.headers.authorization?.split(' ')[1]

  if (!token) {
    reply.status(401).send({ message: 'No token provided' })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })

    if (!user) {
      reply.status(401).send({ message: 'User not found' })
      return
    }

    const { id } = request.params as { id: string }
    await prisma.member.delete({ where: { id } })

    reply.send({ message: 'Member deleted successfully' })
  } catch (error) {
    reply.status(500).send({ message: 'Error deleting member' })
  }
})

// Add send-invite route
app.post('/api/members/:id/send-invite', async (request: FastifyRequest<{
  Params: {
    id: string
  }
}>, reply: FastifyReply) => {
  const token = request.headers.authorization?.split(' ')[1]

  if (!token) {
    reply.status(401).send({ message: 'No token provided' })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })

    if (!user) {
      reply.status(401).send({ message: 'User not found' })
      return
    }

    const { id } = request.params
    console.log('Sending invite for member:', id)

    const member = await prisma.member.findUnique({
      where: { id },
    })

    if (!member) {
      console.log('Member not found:', id)
      reply.status(404).send({ message: 'Member not found' })
      return
    }

    if (member.status !== 'PENDING') {
      console.log('Member is not in pending status:', member.status)
      reply.status(400).send({ message: 'Member is not in pending status' })
      return
    }

    const invitationToken = uuidv4()
    console.log('Generated invitation token:', invitationToken)

    await prisma.member.update({
      where: { id },
      data: { 
        invitationToken,
        updatedAt: new Date()
      },
    })

    console.log('Sending invitation email to:', member.email)
    await sendInvite(member.email, member.name, invitationToken)
    console.log('Invitation sent successfully')
    
    reply.send({ success: true })
  } catch (error) {
    console.error('Error sending invitation:', error)
    reply.status(500).send({ 
      message: 'Error sending invitation',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Start server
const start = async () => {
  try {
    await app.listen({ port: 3001 })
    console.log('Server is running on http://localhost:3001')
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

start() 