import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { generateVerificationCode, verifyCode } from '../../services/emailVerification'
import { sendMemberInvitation, sendInvite } from '../../services/email'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../../lib/prisma'
import { MembershipType, MemberStatus } from '@prisma/client'
import crypto from 'crypto'
import { authMiddleware } from '../../middleware/auth'

interface CreateMemberBody {
  name: string
  email: string
  phone?: string | null
  address?: string | null
  membershipType?: MembershipType
  status?: MemberStatus
  notes?: string | null
}

interface UpdateMemberBody {
  name?: string
  email?: string
  phone?: string | null
  address?: string | null
  membershipType?: MembershipType
  status?: MemberStatus
  notes?: string | null
}

interface RouteParams {
  id: string
}

export async function membersRoutes(app: FastifyInstance) {
  // Get all members
  app.get('/members', {
    preHandler: [authMiddleware],
  }, async (_request, reply) => {
    try {
      const members = await prisma.member.findMany({
        orderBy: {
          name: 'asc',
        },
      })
      return reply.send(members)
    } catch (error) {
      console.error('Error fetching members:', error)
      return reply.status(500).send({ error: 'Failed to fetch members' })
    }
  })

  // Search members
  app.get('/members/search', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      const { query } = request.query as { query: string }
      
      if (!query || query.length < 2) {
        return reply.send([])
      }

      const members = await prisma.member.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
          user: {
            isNot: null
          }
        },
        take: 10,
        orderBy: {
          name: 'asc',
        },
      })

      return reply.send(members)
    } catch (error) {
      console.error('Error searching members:', error)
      return reply.status(500).send({ error: 'Failed to search members' })
    }
  })

  // Get member by ID
  app.get('/members/:id', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const member = await prisma.member.findUnique({
        where: { id },
      })
      if (!member) {
        return reply.status(404).send({ error: 'Member not found' })
      }
      return reply.send(member)
    } catch (error) {
      console.error('Error fetching member:', error)
      return reply.status(500).send({ error: 'Failed to fetch member' })
    }
  })

  // Create member
  app.post<{ Body: CreateMemberBody }>('/members', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      const { name, email, phone, address, membershipType, status, notes } = request.body
      const member = await prisma.member.create({
        data: {
          name,
          email,
          phone,
          address,
          membershipType: membershipType || 'REGULAR',
          status: status || 'PENDING',
          notes,
          managedById: request.user?.userId,
        },
        include: {
          user: true,
        },
      })
      return reply.status(201).send(member)
    } catch (error) {
      console.error('Error creating member:', error)
      if ((error as any).code === 'P2002') {
        return reply.status(400).send({ error: 'Email already exists' })
      }
      return reply.status(500).send({ error: 'Failed to create member' })
    }
  })

  // Update member
  app.put<{ Params: { id: string }; Body: UpdateMemberBody }>('/members/:id', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      const { name, email, phone, address, membershipType, status, notes } = request.body
      const member = await prisma.member.update({
        where: { id: request.params.id },
        data: {
          name,
          email,
          phone,
          address,
          membershipType,
          status,
          notes,
        },
        include: {
          user: true,
        },
      })
      return reply.send(member)
    } catch (error) {
      console.error('Error updating member:', error)
      return reply.status(500).send({ error: 'Failed to update member' })
    }
  })

  // Delete member
  app.delete<{ Params: { id: string } }>('/members/:id', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      await prisma.member.delete({
        where: { id: request.params.id },
      })
      return reply.status(204).send()
    } catch (error) {
      console.error('Error deleting member:', error)
      return reply.status(500).send({ error: 'Failed to delete member' })
    }
  })

  // Update member status
  app.patch<{ Params: { id: string }; Body: { status: MemberStatus } }>('/members/:id/status', async (request, reply) => {
    try {
      const member = await prisma.member.update({
        where: { id: request.params.id },
        data: { status: request.body.status },
        include: {
          user: true,
        },
      })
      return reply.send(member)
    } catch (error) {
      console.error('Error updating member status:', error)
      return reply.status(500).send({ error: 'Failed to update member status' })
    }
  })

  app.post('/members/:id/verify-email', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })
    const bodySchema = z.object({
      code: z.string().length(6),
    })

    const { id } = paramsSchema.parse(request.params)
    const { code } = bodySchema.parse(request.body)

    const member = await prisma.member.findUnique({
      where: { id },
    })

    if (!member) {
      return reply.status(404).send({ error: 'Member not found' })
    }

    try {
      await verifyCode(member.email, code)
      await prisma.member.update({
        where: { id },
        data: { status: 'ACTIVE' },
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

    const member = await prisma.member.findUnique({
      where: { id },
    })

    if (!member) {
      return reply.status(404).send({ error: 'Member not found' })
    }

    const invitationToken = uuidv4()
    await prisma.member.update({
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

    const member = await prisma.member.findUnique({
      where: { id },
    })

    if (!member) {
      return reply.status(404).send({ error: 'Member not found' })
    }

    if (member.status !== 'PENDING') {
      return reply.status(400).send({ error: 'Member is not in pending status' })
    }

    const invitationToken = uuidv4()
    await prisma.member.update({
      where: { id },
      data: { invitationToken },
    })

    await sendInvite(member.email, member.name, invitationToken)
    return { success: true }
  })

  // Verify member email
  app.post<{ Body: { email: string; code: string } }>('/members/verify-email', async (request, reply) => {
    try {
      const { email, code } = request.body
      const verification = await prisma.emailVerification.findFirst({
        where: {
          email,
          code,
          used: false,
          expiresAt: { gt: new Date() },
        },
      })

      if (!verification) {
        return reply.status(400).send({ error: 'Invalid or expired verification code' })
      }

      await prisma.$transaction([
        prisma.member.update({
          where: { email },
          data: { status: 'ACTIVE' },
        }),
        prisma.emailVerification.update({
          where: { id: verification.id },
          data: { used: true },
        }),
      ])

      return reply.send({ message: 'Email verified successfully' })
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to verify email' })
    }
  })

  // Send member invitation
  app.post<{ Body: { email: string } }>('/members/invite', async (request, reply) => {
    try {
      const { email } = request.body
      const invitationToken = crypto.randomUUID()
      
      const member = await prisma.member.create({
        data: {
          email,
          name: 'Pending Member',
          status: 'PENDING',
          membershipType: 'REGULAR',
          invitationToken,
          managedById: request.user?.userId,
        },
      })

      // TODO: Send invitation email with token
      return reply.status(201).send({ message: 'Invitation sent successfully' })
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to send invitation' })
    }
  })
}