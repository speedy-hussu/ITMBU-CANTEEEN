import fastify, { FastifyError, FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import cookie from "@fastify/cookie";
import websocket from "@fastify/websocket";
import jwtPlugin from "./plugins/jwt";

// Routes
import authRoutes from "./modules/auth/route";
import itemRoutes from "./modules/ITEM/route";
// Import more routes as neededk
// import userRoutes from "./modules/user/route";
// import orderRoutes from "./modules/order/route";

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "HH:MM:ss Z",
        },
      },
    },
    bodyLimit: 2000 * 1024, // 2MB
  });

  // ========== PLUGINS ==========

  // CORS - Allow credentials for cookies
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  });

  // Cookie parser - MUST be before routes
  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || "your-cookie-secret-key",
    parseOptions: {},
  });

  // Parse application/x-www-form-urlencoded
  await app.register(formbody);

  // WebSocket support
  await app.register(websocket);

  // JWT Plugin
  await app.register(jwtPlugin);

  // ========== ROUTES ==========

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // API Routes
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(itemRoutes, { prefix: "/api/items" });
  // await app.register(userRoutes, { prefix: "/api/users" });
  // await app.register(orderRoutes, { prefix: "/api/orders" });

  // ========== WebSocket Routes ==========
  // Import based on mode (local vs cloud)
  const IS_CLOUD = process.env.IS_CLOUD === "true";

  if (IS_CLOUD) {
    // Cloud server mode - handles online orders
    const { registerCloudWebSocket } = await import("./ws/cloud/index");
    await registerCloudWebSocket(app);
  } else {
    // Local server mode - handles POS/KDS
    const { LocalWebSocketServer } = await import("./ws/local/index");
    const wsServer = new LocalWebSocketServer(app);
    await wsServer.initialize();
  }

  // ========== ERROR HANDLERS ==========

  // Global error handler
  app.setErrorHandler((error: FastifyError, request, reply) => {
    app.log.error(error);

    // JWT errors
    if (error.message === "No Authorization was found in request.headers") {
      return reply.code(401).send({
        error: "Unauthorized",
        message: "Missing authentication token",
      });
    }

    // Validation errors
    if (error.validation) {
      return reply.code(400).send({
        error: "Validation Error",
        message: error.message,
        details: error.validation,
      });
    }

    // Default error
    reply.code(error.statusCode || 500).send({
      error: error.name || "Internal Server Error",
      message: error.message || "Something went wrong",
    });
  });

  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: "Not Found",
      message: `Route ${request.method}:${request.url} not found`,
    });
  });

  // ========== LIFECYCLE HOOKS ==========

  // Log all requests (optional)
  app.addHook("onRequest", async (request) => {
    app.log.info(
      { url: request.url, method: request.method },
      "Incoming request"
    );
  });

  // Response time logging
  app.addHook("onResponse", async (request, reply) => {
    const responseTime = reply.elapsedTime.toFixed(2);
    app.log.info(
      {
        url: request.url,
        method: request.method,
        statusCode: reply.statusCode,
        responseTime: `${responseTime}ms`,
      },
      "Request completed"
    );
  });

  return app;
}
