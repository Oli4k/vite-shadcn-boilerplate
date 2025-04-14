import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { hash, compare } from 'bcryptjs'
import config from '../config'

const prisma = new PrismaClient()

interface TokenPayload {
  userId: string
  type: 'access' | 'refresh'
}

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    config.JWT_SECRET,
    { expiresIn: '15m' }
  )
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    config.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  )
  return { accessToken, refreshToken }
}

export const verifyToken = (token: string, type: 'access' | 'refresh' = 'access'): TokenPayload | null => {
  try {
    const secret = type === 'access' ? config.JWT_SECRET : config.REFRESH_TOKEN_SECRET
    const decoded = jwt.verify(token, secret) as TokenPayload
    
    if (decoded.type !== type) {
      return null
    }
    
    return decoded
  } catch (error) {
    return null
  }
}

export const hashPassword = async (password: string): Promise<string> => {
  return hash(password, 10)
}

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  return compare(password, hashedPassword)
}

export const registerUser = async (email: string, password: string, name?: string) => {
  const hashedPassword = await hashPassword(password)
  
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  })
}

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
    },
  })
}

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  })
} 