import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '@/middleware/auth'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { generateVerificationCode, verifyCode } from '../../services/emailVerification'
import { sendMemberInvitation, sendInvite } from '../../services/email'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../../lib/prisma'

const router = Router()
const prismaClient = new PrismaClient()

// Get all members
router.get('/', authenticateToken, async (req, res) => {
  try {
    const members = await prismaClient.member.findMany({
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
    res.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    res.status(500).json({ error: 'Failed to fetch members' })
  }
})

// Create a new member
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, membershipType, status, notes } = req.body

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' })
    }

    const member = await prismaClient.member.create({
      data: {
        name,
        email,
        phone,
        address,
        membershipType,
        status,
        notes,
        managedById: req.user?.id, // Set the current user as the manager
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

    res.status(201).json(member)
  } catch (error) {
    console.error('Error creating member:', error)
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists' })
    } else {
      res.status(500).json({ error: 'Failed to create member' })
    }
  }
})

export async function memberRoutes(app: FastifyInstance) {
  app.post('/members/:id/verify-email', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })
    const bodySchema = z.object({
      code: z.string().length(6),
    })

    const { id } = paramsSchema.parse(request.params)
    const { code } = bodySchema.parse(request.body)

    const member = await prismaClient.member.findUnique({
      where: { id },
    })

    if (!member) {
      return reply.status(404).send({ error: 'Member not found' })
    }

    try {
      await verifyCode(member.email, code)
      await prismaClient.member.update({
        where: { id },
        data: { emailVerified: true },
      })
      return { success: true }
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid verification code' })
    }
  })

  app.post('/members/:id/resend-invitation', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const member = await prismaClient.member.findUnique({
      where: { id },
    })

    if (!member) {
      return reply.status(404).send({ error: 'Member not found' })
    }

    const invitationToken = uuidv4()
    await prismaClient.member.update({
      where: { id },
      data: { invitationToken },
    })

    await sendMemberInvitation(member.email, member.name, invitationToken)
    return { success: true }
  })

  app.post('/members/:id/send-invite', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const member = await prismaClient.member.findUnique({
      where: { id },
    })

    if (!member) {
      return reply.status(404).send({ error: 'Member not found' })
    }

    if (member.status !== 'PENDING') {
      return reply.status(400).send({ error: 'Member is not in pending status' })
    }

    const invitationToken = uuidv4()
    await prismaClient.member.update({
      where: { id },
      data: { invitationToken },
    })

    await sendInvite(member.email, member.name, invitationToken)
    return { success: true }
  })
}

export default router 