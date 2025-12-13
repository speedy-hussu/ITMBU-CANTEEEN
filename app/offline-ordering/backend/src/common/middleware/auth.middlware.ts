import { FastifyRequest, FastifyReply } from "fastify";

export async function authGuard(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch (err) {
    reply.code(401).send({ message: "Unauthorized" });
  }
}
