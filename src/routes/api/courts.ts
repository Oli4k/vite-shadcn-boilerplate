import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import { authMiddleware } from '../../middleware/auth'
import { CourtStatus, CourtSurface, CourtType, Court } from '@prisma/client'

interface ParamsWithId {
  id: string
}

interface ErrorResponse {
  error: string
}

interface CreateCourtData {
  name: string
  surface: CourtSurface
  type: CourtType
  hasLights?: boolean
}

interface UpdateCourtData {
  name?: string
  surface?: CourtSurface
  type?: CourtType
  status?: CourtStatus
  hasLights?: boolean
}

interface TimeSlot {
  startTime: string
  endTime: string
}

export async function courtsRoutes(app: FastifyInstance) {
  // Get all courts
  app.get('/courts', {
    preHandler: [authMiddleware],
  }, async (_request, reply) => {
    try {
      const courts = await prisma.court.findMany({
        orderBy: {
          name: 'asc',
        },
      })
      return reply.send(courts)
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
      return reply.send(court)
    } catch (error) {
      console.error('Error fetching court:', error)
      return reply.status(500).send({ error: 'Failed to fetch court' })
    }
  })

  // Create court
  app.post<{
    Body: CreateCourtData,
    Reply: Court | ErrorResponse
  }>('/courts', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      const { name, surface, type, hasLights = false } = request.body
      const court = await prisma.court.create({
        data: {
          id: crypto.randomUUID(),
          name,
          surface,
          type,
          hasLights,
          status: CourtStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
      return reply.status(201).send(court)
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
      const { name, surface, type, status, hasLights } = request.body
      const court = await prisma.court.update({
        where: { id },
        data: {
          name,
          surface,
          type,
          status,
          hasLights,
          updatedAt: new Date(),
        },
      })
      return reply.send(court)
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
      const selectedDate = date ? new Date(date) : new Date()
      selectedDate.setHours(0, 0, 0, 0)

      // Get all active courts
      const courts = await prisma.court.findMany({
        where: {
          status: CourtStatus.ACTIVE
        },
        include: {
          Booking: {
            where: {
              startTime: {
                gte: selectedDate,
                lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
              },
              status: 'confirmed'
            }
          }
        }
      })

      // Generate time slots for the day (7:00 to 22:00, 30-minute intervals)
      const timeSlots: TimeSlot[] = []
      const startHour = 7
      const endHour = 22
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const startTime = new Date(selectedDate)
          startTime.setHours(hour, minute)
          
          const endTime = new Date(startTime)
          endTime.setMinutes(endTime.getMinutes() + 30)
          
          timeSlots.push({
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          })
        }
      }

      // Check availability for each court and time slot
      const availability = courts.map(court => {
        const slots = timeSlots.map(slot => {
          const isBooked = court.Booking.some(booking => {
            const bookingStart = new Date(booking.startTime)
            const bookingEnd = new Date(booking.endTime)
            const slotStart = new Date(slot.startTime)
            const slotEnd = new Date(slot.endTime)
            
            return (
              (slotStart >= bookingStart && slotStart < bookingEnd) ||
              (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
              (slotStart <= bookingStart && slotEnd >= bookingEnd)
            )
          })
          
          return {
            ...slot,
            available: !isBooked
          }
        })
        
        return {
          id: court.id,
          name: court.name,
          surface: court.surface,
          type: court.type,
          hasLights: court.hasLights,
          slots
        }
      })

      return reply.send(availability)
    } catch (error) {
      console.error('Error fetching court availability:', error)
      return reply.status(500).send({ error: 'Failed to fetch court availability' })
    }
  })
} 