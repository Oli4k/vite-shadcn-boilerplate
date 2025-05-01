import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authMiddleware } from '@/middleware/auth'

interface ParamsWithId {
  id: string
}

interface CreateBookingParticipant {
  email: string
  name: string
  isMember: boolean
  memberId?: string
}

interface CreateBookingBody {
  courtId: string
  memberId: string
  startTime: string
  endTime: string
  type: string
  participants: CreateBookingParticipant[]
}

type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    court: true
    member: true
    participants: {
      include: {
        member: true
      }
    }
  }
}>

export async function bookingsRoutes(app: FastifyInstance) {
  // Get all bookings
  app.get('/bookings', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      const bookings = await prisma.booking.findMany({
        include: {
          court: true,
          member: true,
          participants: {
            include: {
              member: true
            }
          },
        },
      })
      return reply.send(bookings)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      return reply.status(500).send({ error: 'Failed to fetch bookings' })
    }
  })

  // Create booking
  app.post<{ Body: CreateBookingBody }>('/bookings', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      const { courtId, memberId, startTime, endTime, type, participants } = request.body

      const booking = await prisma.booking.create({
        data: {
          courtId,
          memberId,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          type,
          participants: {
            create: participants.map(participant => ({
              name: participant.name,
              email: participant.email,
              isMember: participant.isMember,
              memberId: participant.isMember ? participant.memberId : null,
            })),
          },
        },
        include: {
          court: true,
          member: true,
          participants: {
            include: {
              member: true
            }
          },
        },
      })

      return reply.status(201).send(booking)
    } catch (error) {
      console.error('Error creating booking:', error)
      return reply.status(500).send({ error: 'Failed to create booking' })
    }
  })

  // Get booking by ID
  app.get<{ Params: ParamsWithId }>('/bookings/:id', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: request.params.id },
        include: {
          court: true,
          member: true,
          participants: {
            include: {
              member: true
            }
          },
        },
      })

      if (!booking) {
        return reply.status(404).send({ error: 'Booking not found' })
      }

      return reply.send(booking)
    } catch (error) {
      console.error('Error fetching booking:', error)
      return reply.status(500).send({ error: 'Failed to fetch booking' })
    }
  })

  // Update booking
  app.put<{ Params: ParamsWithId; Body: CreateBookingBody }>('/bookings/:id', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      const { courtId, memberId, startTime, endTime, type, participants } = request.body

      // First delete existing participants
      await prisma.bookingParticipant.deleteMany({
        where: { bookingId: request.params.id },
      })

      // Then update booking with new data
      const booking = await prisma.booking.update({
        where: { id: request.params.id },
        data: {
          courtId,
          memberId,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          type,
          participants: {
            create: participants.map(participant => ({
              name: participant.name,
              email: participant.email,
              isMember: participant.isMember,
              memberId: participant.isMember ? participant.memberId : null,
            })),
          },
        },
        include: {
          court: true,
          member: true,
          participants: {
            include: {
              member: true
            }
          },
        },
      })

      return reply.send(booking)
    } catch (error) {
      console.error('Error updating booking:', error)
      return reply.status(500).send({ error: 'Failed to update booking' })
    }
  })

  // Delete booking
  app.delete<{ Params: ParamsWithId }>('/bookings/:id', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      await prisma.booking.delete({
        where: { id: request.params.id },
      })
      return reply.status(204).send()
    } catch (error) {
      console.error('Error deleting booking:', error)
      return reply.status(500).send({ error: 'Failed to delete booking' })
    }
  })
} 