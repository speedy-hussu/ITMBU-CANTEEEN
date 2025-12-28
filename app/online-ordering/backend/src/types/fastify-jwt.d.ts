// src/@types/fastify-jwt.d.ts
import "@fastify/jwt";

declare module "fastify" {
  export interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { enrollmentId: string }; // Removed password
    user: { enrollmentId: string }; // Removed password
  }
}
