// In auth/route.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  loginController,
  logoutController,
} from "./controller/auth.controller";
import { LoginRequest } from "@shared/src/types/user.types";

export default async function (app: FastifyInstance) {
  app.post<{ Body: LoginRequest }>(
    "/login",
    async (req: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) =>
      loginController(app, req, reply)
  );

  app.post("/logout", async (req: FastifyRequest, reply: FastifyReply) =>
    logoutController(app, req, reply)
  );
}
