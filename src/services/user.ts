import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../utils/password'

const prisma = new PrismaClient()

export interface User {
  id: string
  email: string
  password: string
  name?: string
  createdAt: Date
  updatedAt: Date
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  })
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  })
}

export async function registerUser(email: string, password: string, name?: string): Promise<User> {
  const hashedPassword = await hashPassword(password)
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  })
} 