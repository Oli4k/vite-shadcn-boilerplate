import 'fastify'
import '@fastify/jwt'

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      userId: string
      iat: number
      exp: number
    }
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string
    }
    user: {
      userId: string
    }
  }
} 