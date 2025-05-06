import jwt from 'jsonwebtoken'
import { config } from '../config'

interface TokenPayload {
  userId: number
  role: string
}

export function generateTokens(userId: number, role: string): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign({ userId, role }, config.JWT_SECRET, {
    expiresIn: '15m',
  })

  const refreshToken = jwt.sign({ userId, role }, config.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  })

  return { accessToken, refreshToken }
}

export function verifyToken(token: string, type: 'access' | 'refresh'): TokenPayload | null {
  try {
    const secret = type === 'access' ? config.JWT_SECRET : config.REFRESH_TOKEN_SECRET
    const decoded = jwt.verify(token, secret) as TokenPayload
    return {
      userId: typeof decoded.userId === 'string' ? parseInt(decoded.userId, 10) : decoded.userId,
      role: decoded.role
    }
  } catch (error) {
    return null
  }
} 