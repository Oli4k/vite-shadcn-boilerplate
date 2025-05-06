import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middleware/auth';
import { Booking, Member, Court } from '@prisma/client';

interface BookingWithRelations extends Booking {
  Court: Court;
  Member: Member;
}

export async function dashboardRoutes(fastify: FastifyInstance) {
  // Get dashboard stats
  fastify.get('/dashboard/stats', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const [
        todayBookings,
        totalMembers,
        courts
      ] = await Promise.all([
        prisma.booking.count({
          where: {
            startTime: {
              gte: todayStart,
              lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
            }
          }
        }),
        prisma.member.count({
          where: { status: 'ACTIVE' }
        }),
        prisma.court.groupBy({
          by: ['status'],
          _count: {
            _all: true
          }
        })
      ]);

      const availableCourts = courts.find(c => c.status === 'ACTIVE')?._count._all ?? 0;
      const maintenanceCourts = courts.find(c => c.status === 'MAINTENANCE')?._count._all ?? 0;

      return {
        todayBookings,
        totalMembers,
        availableCourts,
        maintenanceCourts,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get upcoming bookings
  fastify.get('/dashboard/bookings', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const bookings = await prisma.booking.findMany({
        where: {
          startTime: {
            gte: new Date()
          }
        },
        include: {
          court: true,
          member: true
        },
        orderBy: {
          startTime: 'asc'
        },
        take: 5
      }) as unknown as BookingWithRelations[];

      return bookings.map(booking => ({
        id: booking.id,
        court_name: booking.Court.name,
        member_name: booking.Member.name,
        start_time: booking.startTime,
        end_time: booking.endTime,
        status: booking.status
      }));
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get recent activity
  fastify.get('/dashboard/activity', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const activities = await prisma.$queryRaw`
        SELECT 
          a.id,
          u.name as member_name,
          a.action_type,
          a.description,
          a.created_at
        FROM "Activity" a
        JOIN "User" u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 5
      `;

      return activities;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });
} 