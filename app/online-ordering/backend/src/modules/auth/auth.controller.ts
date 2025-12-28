// src/modules/auth/controller/auth.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { verifyUser } from "./auth.service";

// src/modules/auth/controller/auth.controller.ts
export const loginHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { enrollmentId, password } = request.body as any;
  const user = await verifyUser(enrollmentId, password);
  console.log(user, "from controller");
  if (!user) {
    return reply.code(401).send({ message: "Invalid credentials" });
  }

  const token = request.server.jwt.sign({
    enrollmentId: user.enrollmentId,
  });

  // Set the cookie
  reply.setCookie("token", token, {
    path: "/",
    secure: process.env.NODE_ENV === "production", // true in production (HTTPS)
    httpOnly: true, // Prevents JavaScript from reading the cookie
    sameSite: "lax", // Protections against CSRF
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  });

  return { message: "Login successful" };
};

export const logoutHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  reply.clearCookie("token", { path: "/" });
  return { message: "Logged out" };
};

export const meHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user;
  return user;
};