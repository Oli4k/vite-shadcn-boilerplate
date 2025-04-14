import Fastify from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'

const prisma = new PrismaClient()
const app = Fastify()

// Register plugins
app.register(cors, {
  origin: true,
  credentials: true,
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
app.post('/api/auth/register', async (request, reply) => {
  const { email, password, name } = request.body as {
    email: string
    password: string
    name?: string
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    })

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
    reply.status(400).send({ message: 'Email already exists' })
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