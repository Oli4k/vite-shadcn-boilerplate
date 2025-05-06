import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import { authMiddleware } from '../../middleware/auth'
import { UserRole, News, Prisma } from '@prisma/client'
import crypto from 'crypto'

// Types
interface ParamsWithId {
  id: string
}

interface PaginationQuery {
  page?: number
  limit?: number
  orderBy?: 'asc' | 'desc'
}

interface NewsFilters {
  published?: boolean
  search?: string
}

interface CreateNewsData {
  title: string
  content: string
  published?: boolean
}

interface UpdateNewsData {
  title?: string
  content?: string
  published?: boolean
}

interface StandardResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

// Helper function to check if user can manage news
function canManageNews(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.STAFF
}

// Helper function to handle pagination
function getPaginationParams(query: PaginationQuery) {
  const page = Math.max(1, query.page || 1)
  const limit = Math.min(100, Math.max(1, query.limit || 10))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

// Helper function to build news filters
function buildNewsFilters(filters: NewsFilters): Prisma.NewsWhereInput {
  const where: Prisma.NewsWhereInput = {}
  
  if (typeof filters.published === 'boolean') {
    where.published = filters.published
  }
  
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { content: { contains: filters.search, mode: 'insensitive' } }
    ]
  }
  
  return where
}

export async function newsRoutes(app: FastifyInstance) {
  // Get all published news (public)
  app.get<{
    Querystring: PaginationQuery & NewsFilters,
    Reply: StandardResponse<News[]>
  }>('/news/public', async (request, reply) => {
    try {
      const { page, limit, skip } = getPaginationParams(request.query)
      const where = buildNewsFilters({ ...request.query, published: true })

      const [news, total] = await Promise.all([
        prisma.news.findMany({
          where,
          include: {
            User: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: request.query.orderBy || 'desc'
          },
          skip,
          take: limit
        }),
        prisma.news.count({ where })
      ])

      return reply.send({
        success: true,
        data: news,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Error fetching news:', error)
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch news'
      })
    }
  })

  // Get all news (admin/staff only)
  app.get<{
    Querystring: PaginationQuery & NewsFilters,
    Reply: StandardResponse<News[]>
  }>('/news', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const user = request.user
    if (!canManageNews(user.role)) {
      return reply.status(403).send({
        success: false,
        error: 'Unauthorized'
      })
    }

    try {
      const { page, limit, skip } = getPaginationParams(request.query)
      const where = buildNewsFilters(request.query)

      const [news, total] = await Promise.all([
        prisma.news.findMany({
          where,
          include: {
            User: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: request.query.orderBy || 'desc'
          },
          skip,
          take: limit
        }),
        prisma.news.count({ where })
      ])

      return reply.send({
        success: true,
        data: news,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Error fetching news:', error)
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch news'
      })
    }
  })

  // Get news by ID
  app.get<{
    Params: ParamsWithId,
    Reply: StandardResponse<News>
  }>('/news/:id', async (request, reply) => {
    try {
      const { id } = request.params
      const news = await prisma.news.findUnique({
        where: { id },
        include: {
          User: {
            select: {
              name: true
            }
          }
        }
      })
      
      if (!news) {
        return reply.status(404).send({
          success: false,
          error: 'News not found'
        })
      }

      if (!news.published) {
        // Check if user is authenticated and has permission
        const user = request.user
        if (!user || !canManageNews(user.role)) {
          return reply.status(403).send({
            success: false,
            error: 'Unauthorized'
          })
        }
      }

      return reply.send({
        success: true,
        data: news
      })
    } catch (error) {
      console.error('Error fetching news:', error)
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch news'
      })
    }
  })

  // Create news (admin/staff only)
  app.post<{
    Body: CreateNewsData,
    Reply: StandardResponse<News>
  }>('/news', {
    preHandler: [authMiddleware],
    schema: {
      body: {
        type: 'object',
        required: ['title', 'content'],
        properties: {
          title: { type: 'string', minLength: 1 },
          content: { type: 'string', minLength: 1 },
          published: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    const user = request.user
    if (!canManageNews(user.role)) {
      return reply.status(403).send({
        success: false,
        error: 'Unauthorized'
      })
    }

    try {
      const data = request.body
      if (!user.userId) {
        throw new Error('Missing userId for news author')
      }
      const news = await prisma.news.create({
        data: {
          id: crypto.randomUUID(),
          title: data.title,
          content: data.content,
          published: data.published ?? false,
          authorId: user.userId,
          updatedAt: new Date(),
        },
        include: {
          User: {
            select: {
              name: true
            }
          }
        }
      })
      return reply.status(201).send({
        success: true,
        data: news
      })
    } catch (error) {
      console.error('Error creating news:', error)
      return reply.status(500).send({
        success: false,
        error: 'Failed to create news'
      })
    }
  })

  // Update news (admin/staff only)
  app.put<{
    Params: ParamsWithId,
    Body: UpdateNewsData,
    Reply: StandardResponse<News>
  }>('/news/:id', {
    preHandler: [authMiddleware],
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1 },
          content: { type: 'string', minLength: 1 },
          published: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    const user = request.user
    if (!canManageNews(user.role)) {
      return reply.status(403).send({
        success: false,
        error: 'Unauthorized'
      })
    }

    try {
      const { id } = request.params
      const data = request.body

      // Check if the news article exists and if the user has permission to edit it
      const existingNews = await prisma.news.findUnique({
        where: { id },
        select: { authorId: true }
      })

      if (!existingNews) {
        return reply.status(404).send({
          success: false,
          error: 'News not found'
        })
      }

      // Staff can only edit their own articles, Admins can edit all
      if (user.role === UserRole.STAFF && existingNews.authorId !== user.userId) {
        return reply.status(403).send({
          success: false,
          error: 'You can only edit your own articles'
        })
      }

      const news = await prisma.news.update({
        where: { id },
        data: {
          title: data.title,
          content: data.content,
          published: data.published
        },
        include: {
          User: {
            select: {
              name: true
            }
          }
        }
      })
      return reply.send({
        success: true,
        data: news
      })
    } catch (error) {
      console.error('Error updating news:', error)
      return reply.status(500).send({
        success: false,
        error: 'Failed to update news'
      })
    }
  })

  // Delete news (admin/staff only)
  app.delete<{
    Params: ParamsWithId,
    Reply: StandardResponse<void>
  }>('/news/:id', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const user = request.user
    if (!canManageNews(user.role)) {
      return reply.status(403).send({
        success: false,
        error: 'Unauthorized'
      })
    }

    try {
      const { id } = request.params

      // Check if the news article exists and if the user has permission to delete it
      const existingNews = await prisma.news.findUnique({
        where: { id },
        select: { authorId: true }
      })

      if (!existingNews) {
        return reply.status(404).send({
          success: false,
          error: 'News not found'
        })
      }

      // Staff can only delete their own articles, Admins can delete all
      if (user.role === UserRole.STAFF && existingNews.authorId !== user.userId) {
        return reply.status(403).send({
          success: false,
          error: 'You can only delete your own articles'
        })
      }

      await prisma.news.delete({
        where: { id }
      })
      return reply.send({
        success: true
      })
    } catch (error) {
      console.error('Error deleting news:', error)
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete news'
      })
    }
  })
} 