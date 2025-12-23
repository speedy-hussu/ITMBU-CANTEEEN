import { validateCredentials } from "../services/auth.service";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { StaffLoginRequest } from "@shared/types/user.types";

export async function loginController(
  app: FastifyInstance,
  req: FastifyRequest<{ Body: StaffLoginRequest }>,
  reply: FastifyReply
) {
  try {
    const { username, password, role } = req.body;

    console.log("🔐 Login attempt:", { username, role });

    // Input validation
    if (!username || !password || !role) {
      return reply.status(400).send({
        success: false,
        message: "Missing required fields",
      });
    }

    // Role check
    if (!["POS", "KDS", "ADMIN"].includes(role)) {
      return reply.status(400).send({
        success: false,
        message: "Invalid role",
      });
    }

    const isValid = validateCredentials(username, password, role);

    if (!isValid) {
      console.log("❌ Invalid credentials");
      return reply.status(401).send({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = app.jwt.sign({ username, role }, { expiresIn: "24h" });

    console.log("✅ Token generated:", token.substring(0, 20) + "...");

    reply.setCookie("token", token, {
      httpOnly: true,
      secure: false, // false for localhost HTTP
      sameSite: "lax", // ✅ Works with localhost
      maxAge: 86400, // 24 hours in seconds
      path: "/",
    });

    console.log("🍪 Cookie set with options:", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return reply.send({
      success: true,
      token,
      user: {
        username,
        role,
      },
    });
  } catch (error: any) {
    console.error("❌ LOGIN ERROR:", error);
    app.log.error(error);
    return reply.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

export async function logoutController(
  app: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    reply.clearCookie("token", {
      path: "/",
    });

    return reply.send({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    app.log.error(error);
    return reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}
