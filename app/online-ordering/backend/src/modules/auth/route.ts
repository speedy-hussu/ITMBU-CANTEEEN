// src/modules/auth/route.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { loginHandler, logoutHandler, meHandler } from "./auth.controller";

// Extend FastifyInstance type to include authenticate method
declare module "fastify" {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/login", loginHandler);
  fastify.post("/logout", logoutHandler);

  // Example of a protected route INSIDE the auth module
  fastify.get("/me", { onRequest: [fastify.authenticate] }, meHandler);
}

export default authRoutes;
