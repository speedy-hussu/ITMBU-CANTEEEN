// In auth/route.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  loginController,
  logoutController,
} from "./controller/auth.controller";

export default async function (app: FastifyInstance) {
  app.post<{ Body: any }>(
    "/login",
    async (req: FastifyRequest<{ Body: any }>, reply: FastifyReply) =>
      loginController(app, req, reply)
  );

  app.post("/logout", async (req: FastifyRequest, reply: FastifyReply) =>
    logoutController(app, req, reply)
  );
}
