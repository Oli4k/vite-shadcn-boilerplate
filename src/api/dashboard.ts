import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db';

export default async function dashboardRoutes(fastify: FastifyInstance) {
  // Get dashboard stats
  fastify.get('/api/dashboard/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const stats = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM bookings WHERE DATE(start_time) = CURRENT_DATE) as today_bookings,
          (SELECT COUNT(*) FROM members WHERE status = 'ACTIVE') as total_members,
          (SELECT COUNT(*) FROM courts WHERE status = 'ACTIVE') as available_courts,
          (SELECT COUNT(*) FROM courts WHERE status = 'MAINTENANCE') as maintenance_courts
      `);

      return {
        todayBookings: parseInt(stats.rows[0].today_bookings),
        totalMembers: parseInt(stats.rows[0].total_members),
        availableCourts: parseInt(stats.rows[0].available_courts),
        maintenanceCourts: parseInt(stats.rows[0].maintenance_courts),
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get upcoming bookings
  fastify.get('/api/dashboard/bookings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const bookings = await pool.query(`
        SELECT 
          b.id,
          c.name as court_name,
          u.name as member_name,
          b.start_time,
          b.end_time,
          b.status
        FROM bookings b
        JOIN courts c ON b.court_id = c.id
        JOIN users u ON b.user_id = u.id
        WHERE DATE(b.start_time) = CURRENT_DATE
          AND b.start_time >= NOW()
        ORDER BY b.start_time ASC
        LIMIT 5
      `);

      return bookings.rows;
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get recent activity
  fastify.get('/api/dashboard/activity', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const activities = await pool.query(`
        SELECT 
          a.id,
          u.name as member_name,
          a.action_type,
          a.description,
          a.created_at
        FROM activities a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 5
      `);

      return activities.rows;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });
} 