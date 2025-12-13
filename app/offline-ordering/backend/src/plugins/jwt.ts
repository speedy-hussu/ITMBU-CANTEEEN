// src/plugins/jwt.ts
import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export default fp(async function (fastify: FastifyInstance) {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in environment");
  }

  fastify.register(jwt, {
    secret: JWT_SECRET,
    cookie: {
      cookieName: "token", // Read JWT from cookie named "token"
      signed: false,       // Set to true if using signed cookies
    },
  });

  // Add authenticate decorator
  fastify.decorate("authenticate", async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify(); // This now checks cookie automatically
    } catch (err) {
      reply.status(401).send({ 
        success: false,
        message: "Unauthorized" 
      });
    }
  });
});