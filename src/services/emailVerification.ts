import { prisma } from '../lib/prisma'
import { sendVerificationCode } from './email'
import { randomInt } from 'crypto'

export async function generateVerificationCode(email: string) {
  // Generate a 6-digit code
  const code = randomInt(100000, 999999).toString()
  
  // Store the code in the database with a 15-minute expiration
  await prisma.emailVerification.create({
    data: {
      email,
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  })

  // Send the code via email
  await sendVerificationCode(email, code)

  return code
}

export async function verifyCode(email: string, code: string) {
  const verification = await prisma.emailVerification.findFirst({
    where: {
      email,
      code,
      expiresAt: {
        gt: new Date(),
      },
      used: false,
    },
  })

  if (!verification) {
    throw new Error('Invalid or expired verification code')
  }

  // Mark the code as used
  await prisma.emailVerification.update({
    where: { id: verification.id },
    data: { used: true },
  })

  return true
} 