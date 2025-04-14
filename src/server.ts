import * as express from 'express'
import type { RequestHandler } from 'express'
import * as cors from 'cors'
import { prisma } from './lib/db.ts'
import { hashPassword, comparePasswords, generateToken, verifyToken } from './lib/auth.ts'

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

interface RegisterBody {
  email: string
  password: string
  name?: string
}

interface LoginBody {
  email: string
  password: string
}

// Register endpoint
const registerHandler: RequestHandler = async (req, res) => {
  try {
    const { email, password, name } = req.body as RegisterBody

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      res.status(400).json({ error: 'User already exists' })
      return
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })

    const token = generateToken(user.id)

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Something went wrong' })
  }
}

app.post('/api/register', registerHandler)

// Login endpoint
const loginHandler: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body as LoginBody

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const isValidPassword = await comparePasswords(password, user.password)

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const token = generateToken(user.id)

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Something went wrong' })
  }
}

app.post('/api/login', loginHandler)

// Protected route example
const meHandler: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      res.status(401).json({ error: 'No token provided' })
      return
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({ user })
  } catch (error) {
    console.error('Auth error:', error)
    res.status(500).json({ error: 'Something went wrong' })
  }
}

app.get('/api/me', meHandler)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
}) 