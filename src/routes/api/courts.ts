import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import { Court, CreateCourtData, UpdateCourtData, CourtStatus, CourtSurface, CourtType } from '../../types'
import { authMiddleware } from '../../middleware/auth'

interface ParamsWithId {
  id: string
}

interface ErrorResponse {
  error: string
}

export async function courtsRoutes(app: FastifyInstance) {
  // Get all courts
  app.get<{
    Reply: Court[] | ErrorResponse
  }>('/courts', {
    preHandler: [authMiddleware],
  }, async (_request, reply) => {
    try {
      const courts = await prisma.court.findMany({
        orderBy: {
          name: 'asc',
        },
      })
      return reply.send(courts.map(court => ({
        ...court,
        id: Number(court.id),
        surface: court.surface,
        type: court.type,
        status: court.status,
      })))
    } catch (error) {
      console.error('Error fetching courts:', error)
      return reply.status(500).send({ error: 'Failed to fetch courts' })
    }
  })

  // Get court by ID
  app.get<{
    Params: ParamsWithId,
    Reply: Court | ErrorResponse
  }>('/courts/:id', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const court = await prisma.court.findUnique({
        where: { id },
      })
      if (!court) {
        return reply.status(404).send({ error: 'Court not found' })
      }
      return reply.send({
        ...court,
        id: Number(court.id),
        surface: court.surface,
        type: court.type,
        status: court.status,
      })
    } catch (error) {
      console.error('Error fetching court:', error)
      return reply.status(500).send({ error: 'Failed to fetch court' })
    }
  })

  // Create new court
  app.post<{
    Body: CreateCourtData,
    Reply: Court | ErrorResponse
  }>('/courts', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      const data = request.body
      const court = await prisma.court.create({
        data: {
          name: data.name,
          surface: data.surface as CourtSurface,
          type: data.type as CourtType,
          status: (data.status || 'ACTIVE') as CourtStatus,
          hasLights: data.hasLights || false,
        },
      })
      return reply.status(201).send({
        ...court,
        id: Number(court.id),
        surface: court.surface,
        type: court.type,
        status: court.status,
      })
    } catch (error) {
      console.error('Error creating court:', error)
      return reply.status(500).send({ error: 'Failed to create court' })
    }
  })

  // Update court
  app.put<{
    Params: ParamsWithId,
    Body: UpdateCourtData,
    Reply: Court | ErrorResponse
  }>('/courts/:id', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const data = request.body
      const court = await prisma.court.update({
        where: { id },
        data: {
          name: data.name,
          surface: data.surface as CourtSurface,
          type: data.type as CourtType,
          status: data.status as CourtStatus,
          hasLights: data.hasLights,
        },
      })
      return reply.send({
        ...court,
        id: Number(court.id),
        surface: court.surface,
        type: court.type,
        status: court.status,
      })
    } catch (error) {
      console.error('Error updating court:', error)
      return reply.status(500).send({ error: 'Failed to update court' })
    }
  })

  // Delete court
  app.delete<{
    Params: ParamsWithId,
    Reply: void | ErrorResponse
  }>('/courts/:id', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      const { id } = request.params
      await prisma.court.delete({
        where: { id },
      })
      return reply.status(204).send()
    } catch (error) {
      console.error('Error deleting court:', error)
      return reply.status(500).send({ error: 'Failed to delete court' })
    }
  })

  // Get court availability
  app.get('/courts/availability', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      const { date } = request.query as { date?: string }
      const courts = await prisma.court.findMany({
        where: {
          status: 'ACTIVE'
        },
        include: {
          bookings: {
            where: {
              startTime: {
                gte: date ? new Date(date) : new Date()
              },
              endTime: {
                lte: date ? new Date(date) : new Date()
              }
            }
          }
        }
      })
      return reply.send(courts.map(court => ({
        ...court,
        id: Number(court.id),
        surface: court.surface,
        type: court.type,
        status: court.status,
      })))
    } catch (error) {
      console.error('Error fetching court availability:', error)
      return reply.status(500).send({ error: 'Failed to fetch court availability' })
    }
  })
} 