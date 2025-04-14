import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'
import { z } from 'zod'
import config from './config'
import { findUserByEmail, findUserById, registerUser, User } from './services/user'
import { comparePasswords } from './utils/password'
import { generateTokens, verifyToken } from './utils/jwt'

// Extend Fastify types
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string
    }
  }
}

const server: FastifyInstance = fastify({
  logger: true,
})

// Register plugins
await server.register(fastifyCors, {
  origin: config.FRONTEND_URL,
  credentials: true,
})

await server.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

await server.register(fastifyCookie, {
  secret: config.JWT_SECRET,
})

await server.register(fastifyJwt, {
  secret: config.JWT_SECRET,
  cookie: {
    cookieName: 'refreshToken',
    signed: true,
  },
})

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// Authentication decorator
server.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch (error) {
    reply.status(401).send({ error: 'Unauthorized' })
  }
})

// Routes
server.post('/api/auth/register', {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '1 minute',
    },
  },
  schema: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        name: { type: 'string' },
      },
    },
  },
}, async (request, reply) => {
  const { email, password, name } = request.body as z.infer<typeof registerSchema>

  const user = await registerUser(email, password, name)
  const { accessToken, refreshToken } = generateTokens(user.id)

  reply.setCookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })

  return reply.status(201).send({
    user,
    accessToken,
  })
})

server.post('/api/auth/login', {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '1 minute',
    },
  },
  schema: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
      },
    },
  },
}, async (request, reply) => {
  const { email, password } = request.body as z.infer<typeof loginSchema>

  const user = await findUserByEmail(email)
  if (!user) {
    return reply.status(401).send({ error: 'Invalid credentials' })
  }

  const isValidPassword = await comparePasswords(password, user.password)
  if (!isValidPassword) {
    return reply.status(401).send({ error: 'Invalid credentials' })
  }

  const { accessToken, refreshToken } = generateTokens(user.id)

  reply.setCookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })

  const { password: _, ...userWithoutPassword } = user
  return reply.send({
    user: userWithoutPassword,
    accessToken,
  })
})

server.post('/api/auth/refresh', async (request, reply) => {
  const refreshToken = request.cookies.refreshToken
  if (!refreshToken) {
    return reply.status(401).send({ error: 'No refresh token provided' })
  }

  const decoded = verifyToken(refreshToken, 'refresh')
  if (!decoded) {
    return reply.status(401).send({ error: 'Invalid refresh token' })
  }

  const user = await findUserById(decoded.userId)
  if (!user) {
    return reply.status(401).send({ error: 'User not found' })
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id)

  reply.setCookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })

  return reply.send({ accessToken })
})

server.post('/api/auth/logout', async (request, reply) => {
  reply.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
  })
  return reply.send({ message: 'Logged out successfully' })
})

server.get('/api/auth/me', {
  onRequest: [server.authenticate],
}, async (request, reply) => {
  const user = await findUserById(request.user!.userId)
  if (!user) {
    return reply.status(404).send({ error: 'User not found' })
  }
  return reply.send({ user })
})

// Start server
const start = async () => {
  try {
    await server.listen({ port: config.PORT, host: '0.0.0.0' })
    console.log(`Server is running on port ${config.PORT}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start() 