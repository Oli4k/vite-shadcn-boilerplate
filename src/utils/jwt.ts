import jwt from 'jsonwebtoken'
import config from '../config'

interface TokenPayload {
  userId: string
}

export function generateTokens(userId: string): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: '15m',
  })

  const refreshToken = jwt.sign({ userId }, config.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  })

  return { accessToken, refreshToken }
}

export function verifyToken(token: string, type: 'access' | 'refresh'): TokenPayload | null {
  try {
    const secret = type === 'access' ? config.JWT_SECRET : config.REFRESH_TOKEN_SECRET
    const decoded = jwt.verify(token, secret) as TokenPayload
    return decoded
  } catch (error) {
    return null
  }
} 