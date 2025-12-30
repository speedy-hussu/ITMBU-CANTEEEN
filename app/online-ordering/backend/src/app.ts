import fastify, { FastifyError, FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import cookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import { authDecorator } from "./decorator/auth.decorator";

// Routes
import userItemRoute from "./modules/items/routes/user.route";
import authRoutes from "./modules/auth/route";

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    trustProxy: true, // MUST BE HERE
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
const isProduction = process.env.NODE_ENV === "production";
await app.register(cors, {
  // 1. Explicitly name your production URL
  origin: isProduction ? "https://itmbu-canteen.vercel.app" : true,

  credentials: true,

  // 2. Be explicit with headers so preflight doesn't fail
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});
  // Cookie parser
  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || "your-cookie-secret-key",
    parseOptions: {},
  });

  // Parse application/x-www-form-urlencoded
  await app.register(formbody);

  // WebSocket support - MUST BE REGISTERED BEFORE WEBSOCKET ROUTES
  await app.register(websocket);

  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "supersecret",
    cookie: {
      cookieName: "token",
      signed: false, // Set to true if you want to sign the cookie itself
    },
  });
  console.log("✅ Fastify plugins registered");
  await app.register(authDecorator);

  app.register(authRoutes, { prefix: "api/auth" });
  // ========== ROUTES ==========

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // API Routes
  await app.register(userItemRoute, { prefix: "/api/items" });

  // ========== WebSocket Routes ==========

  console.log(`\n🔧 Server Mode:  "CLOUD"`);

  console.log("☁️  Initializing Cloud WebSocket Server...\n");

  // Dynamic import
  const { registerCloudWebSocket } = await import("./ws/wsCloud");

  // Register cloud websocket
  await registerCloudWebSocket(app);

  console.log("✅ Cloud WebSocket Server registered\n");

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

  // Log all requests
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
