// src/decorator/auth.decorator.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";

// src/decorator/auth.decorator.ts
export const authDecorator = fp(async (fastify: FastifyInstance) => {
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // @fastify/jwt will now automatically look in cookies if configured in app.ts
        await request.jwtVerify();
      } catch (err) {
        reply.code(401).send({ message: "Authentication required" });
      }
    }
  );
});
