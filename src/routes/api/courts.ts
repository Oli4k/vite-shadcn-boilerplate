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
      const selectedDate = date ? new Date(date) : new Date()
      selectedDate.setHours(0, 0, 0, 0)

      // Get all active courts
      const courts = await prisma.court.findMany({
        where: {
          status: 'ACTIVE'
        },
        include: {
          bookings: {
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
      interface TimeSlot {
        startTime: string;
        endTime: string;
      }
      
      const timeSlots: TimeSlot[] = []
      for (let hour = 7; hour < 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          timeSlots.push({
            startTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
            endTime: `${(hour + (minute + 30 >= 60 ? 1 : 0)).toString().padStart(2, '0')}:${((minute + 30) % 60).toString().padStart(2, '0')}`,
          })
        }
      }

      // Map courts with their available slots
      const courtsWithSlots = courts.map(court => {
        const bookedSlots = new Set(
          court.bookings.map(booking => 
            `${booking.startTime.getHours().toString().padStart(2, '0')}:${booking.startTime.getMinutes().toString().padStart(2, '0')}`
          )
        )

        const availableSlots = timeSlots.map(slot => {
          const isBooked = bookedSlots.has(slot.startTime)
          const hour = parseInt(slot.startTime.split(':')[0])
          const isPeak = hour >= 17 && hour < 20
          
          return {
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBooked,
            price: isPeak ? 30 : 20, // Example pricing: $30 for peak hours, $20 for off-peak
          }
        })

        return {
          ...court,
          id: Number(court.id),
          surface: court.surface,
          type: court.type,
          status: court.status,
          availableSlots,
        }
      })

      return reply.send(courtsWithSlots)
    } catch (error) {
      console.error('Error fetching court availability:', error)
      return reply.status(500).send({ error: 'Failed to fetch court availability' })
    }
  })
} 