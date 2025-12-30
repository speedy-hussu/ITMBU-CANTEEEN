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

  if (!user) {
    return reply.code(401).send({ message: "Invalid credentials" });
  }

  const token = request.server.jwt.sign({
    enrollmentId: user.enrollmentId,
  });

reply.setCookie("token", token, {
  path: "/",
  secure: true, // Force true
  httpOnly: true,
  sameSite: "none", // Force none
  maxAge: 60 * 60 * 24 * 7,
});


  // ✅ RETURN THE USER DATA
  // This allows the frontend to do: login(response.user)
  return {
    message: "Login successful",
    user: {
      enrollmentId: user.enrollmentId,
      // Add other fields here like name, role, etc., if they exist in your DB
    },
  };
};
export const logoutHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  reply.clearCookie("token", { path: "/" });
  return { message: "Logged out" };
};

export const meHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const user = request.user;
  return user;
};
