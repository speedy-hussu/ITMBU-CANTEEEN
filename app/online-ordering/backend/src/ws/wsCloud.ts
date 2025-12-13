// ☁️ CLOUD SERVER - WebSocket Handler
import { FastifyInstance } from "fastify";
import { WebSocket } from "ws";
// import type { WebSocketMessage } from "@shared/types/websocket.types";

interface PendingOrder {
  cloudOrderId: string;
  order: any;
  timestamp: number;
  attempts: number;
}

export class CloudWebSocketServer {
  private localConnection: WebSocket | null = null;
  private studentConnections: Set<WebSocket> = new Set();
  private pendingOrders: Map<string, PendingOrder> = new Map();
  private isLocalConnected = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private app: FastifyInstance) {}

  async initialize() {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("☁️  CLOUD WEBSOCKET SERVER INITIALIZATION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // WebSocket endpoint for LOCAL server to connect
    this.app.get("/ws/local", { websocket: true }, (socket: WebSocket, req) => {
      console.log(`\n🔔 NEW CONNECTION ATTEMPT from ${req.ip}`);
      this.handleLocalConnection(socket);
    });

    // WebSocket endpoint for STUDENT backends to connect
    this.app.get("/ws/student", { websocket: true }, (socket: WebSocket) => {
      this.handleStudentConnection(socket);
    });

    // REST API for student orders (fallback)
    this.app.post("/api/orders", async (request, reply) => {
      try {
        const order = request.body;
        const result = await this.receiveStudentOrder(order);

        return reply.code(201).send({
          success: true,
          ...result,
          message: result.queued
            ? "Order queued, will be sent when canteen is online"
            : "Order sent to canteen",
        });
      } catch (error) {
        console.error("Error creating order:", error);
        return reply.code(500).send({
          success: false,
          error: "Failed to create order",
        });
      }
    });

    // Status endpoint - check if local canteen is online
    this.app.get("/api/status", async () => ({
      canteenOnline: this.isLocalConnected,
      pendingOrders: this.pendingOrders.size,
      connectedStudents: this.studentConnections.size,
      uptime: process.uptime(),
    }));

    // Health check endpoint
    this.app.get("/api/health", async () => ({
      status: "healthy",
      timestamp: Date.now(),
    }));

    const port = process.env.PORT || 4000;
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📡 Cloud Server WebSocket Endpoints:");
    console.log(`   - ws://localhost:${port}/ws/local`);
    console.log(`   - ws://localhost:${port}/ws/student`);
    console.log("\n📡 REST API Endpoints:");
    console.log(`   - POST http://localhost:${port}/api/orders`);
    console.log(`   - GET  http://localhost:${port}/api/status`);
    console.log(`   - GET  http://localhost:${port}/api/health`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⏳ Waiting for local canteen server to connect...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }

  // ==================== LOCAL SERVER CONNECTION ====================
  private handleLocalConnection(socket: WebSocket) {
    console.log("🔌 Local server connecting...");

    // Close existing connection if any
    if (this.localConnection) {
      console.log("⚠️  Replacing existing local connection");
      this.localConnection.close();
    }

    this.localConnection = socket;
    this.isLocalConnected = true;

    console.log("✅ Local server connected to cloud!\n");

    // Start heartbeat to keep connection alive
    this.startHeartbeat();

    // Sync any pending orders
    this.syncPendingOrders();

    // Handle incoming messages from local
    socket.on("message", (data: Buffer) => {
      try {
        const message: any = JSON.parse(data.toString());
        this.handleLocalMessage(message);
        console.log("order send to local", message);
      } catch (error) {
        console.error("❌ Error parsing local message:", error);
      }
    });

    // Handle disconnection
    socket.on("close", (code: number, reason: Buffer) => {
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("❌ Local server disconnected from cloud");
      console.log(`   Code: ${code}, Reason: ${reason.toString() || "None"}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      this.isLocalConnected = false;
      this.localConnection = null;
      this.stopHeartbeat();
    });

    socket.on("error", (error: Error) => {
      console.error("❌ Local WebSocket error:", error.message);
    });

    // Handle pong responses (for heartbeat)
    socket.on("pong", () => {
      console.log("💓 Heartbeat acknowledged by local");
    });
  }

  private handleLocalMessage(message: any) {
    const { type, payload } = message;

    console.log(`📨 ⬇️  Message from local: ${type}`);

    switch (type) {
      case "local_connected":
        console.log("✅ Local server confirmed connection");
        console.log(`   Info:`, payload);
        break;

      case "order_ack":
        this.handleOrderAcknowledgment(payload);
        break;

      case "order_completed":
        this.handleOrderCompleted(payload);
        break;

      case "order_cancelled":
        this.handleOrderCancelled(payload);
        break;

      case "update_status":
        this.handleStatusUpdate(payload);
        break;

      case "pong":
        console.log("💓 Pong from local");
        break;

      default:
        console.log(`⚠️  Unknown message type from local: ${type}`);
    }
  }

  private handleOrderAcknowledgment(payload: any) {
    const { cloudOrderId, success, localOrderId, error } = payload;

    if (success && cloudOrderId) {
      this.pendingOrders.delete(cloudOrderId);
      console.log(
        `✅ Order acknowledged: ${cloudOrderId} (Local ID: ${localOrderId})`
      );

      this.broadcastToStudents({
        type: "order_ack",
        payload: { cloudOrderId, localOrderId, success: true },
        timestamp: Date.now(),
      });
    } else {
      console.error(`❌ Order acknowledgment failed: ${cloudOrderId}`, error);

      this.broadcastToStudents({
        type: "order_ack",
        payload: {
          cloudOrderId,
          success: false,
          error: error || "Unknown error",
        },
        timestamp: Date.now(),
      });

      const pendingOrder = this.pendingOrders.get(cloudOrderId);
      if (pendingOrder) {
        pendingOrder.attempts++;
        if (pendingOrder.attempts >= 3) {
          this.pendingOrders.delete(cloudOrderId);
          console.log(`❌ Order ${cloudOrderId} failed after 3 attempts`);
        }
      }
    }
  }

  private handleOrderCompleted(payload: any) {
    console.log("✅ Order completed from local:", payload);
    this.broadcastToStudents({
      type: "order_completed",
      payload: {
        cloudOrderId: payload.cloudOrderId,
        localOrderId: payload.localOrderId,
        token: payload.token,
      },
      timestamp: Date.now(),
    });
  }

  private handleOrderCancelled(payload: any) {
    console.log("❌ Order cancelled from local:", payload);
    this.broadcastToStudents({
      type: "order_cancelled",
      payload: {
        cloudOrderId: payload.cloudOrderId,
        localOrderId: payload.localOrderId,
        token: payload.token,
      },
      timestamp: Date.now(),
    });
  }

  private handleStatusUpdate(payload: any) {
    console.log("📦 Order status update from local:", payload);
    this.broadcastToStudents({
      type: "update_status",
      payload,
      timestamp: Date.now(),
    });
  }

  // ==================== STUDENT BACKEND CONNECTION ====================
  // In your Cloud Server (cloud/index.ts)
  // Replace the student connection handler with this fixed version:

  private handleStudentConnection(socket: WebSocket) {
    console.log("🎓 Student backend connected to cloud");

    this.studentConnections.add(socket);

    // Send initial connection message
    socket.send(
      JSON.stringify({
        type: "connection_established",
        payload: {
          message: "Connected to cloud server",
          canteenOnline: this.isLocalConnected,
        },
        timestamp: Date.now(),
      })
    );

    socket.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "student_order") {
          console.log("📥 Student order received from student:", message);

          // ✅ FIX: Pass the order data correctly
          const result = await this.receiveStudentOrder(
            message.payload.order // Just the order object
          );

          // Optionally confirm reception back to the student
          socket.send(
            JSON.stringify({
              type: "student_order_received",
              payload: {
                cloudOrderId: result.cloudOrderId,
                success: true,
                queued: result.queued,
              },
              timestamp: Date.now(),
            })
          );
        }
      } catch (error) {
        console.error("❌ Failed to process student message:", error);
        socket.send(
          JSON.stringify({
            type: "error",
            payload: {
              message: "Failed to process order",
              error: error instanceof Error ? error.message : "Unknown error",
            },
            timestamp: Date.now(),
          })
        );
      }
    });

    socket.on("close", () => {
      console.log("👋 Student backend disconnected");
      this.studentConnections.delete(socket);
    });

    socket.on("error", (error: Error) => {
      console.error("❌ Student connection error:", error.message);
      this.studentConnections.delete(socket);
    });
  }

  // ✅ Also update receiveStudentOrder to generate cloudOrderId internally
  async receiveStudentOrder(order: any): Promise<{
    queued: boolean;
    cloudOrderId: string;
  }> {
    // Generate cloudOrderId here instead of expecting it from outside
    const cloudOrderId = `CLOUD-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    console.log("📦 Processing order:", {
      cloudOrderId,
      orderData: order,
    });

    if (this.isLocalConnected) {
      this.sendToLocal({
        type: "student_order",
        payload: { cloudOrderId, order },
        timestamp: Date.now(),
      });

      console.log(`📤 Student order sent to local: ${cloudOrderId}`);
      return { queued: false, cloudOrderId };
    } else {
      this.pendingOrders.set(cloudOrderId, {
        cloudOrderId,
        order,
        timestamp: Date.now(),
        attempts: 0,
      });

      console.log(`📥 Student order queued (local offline): ${cloudOrderId}`);
      return { queued: true, cloudOrderId };
    }
  }

  private broadcastToStudents(message: any) {
    const data = JSON.stringify(message);
    let sentCount = 0;

    this.studentConnections.forEach((conn) => {
      if (conn.readyState === WebSocket.OPEN) {
        try {
          conn.send(data);
          sentCount++;
        } catch (error) {
          console.error("Failed to send to student:", error);
        }
      }
    });

    if (sentCount > 0) {
      console.log(`📤 Sent to ${sentCount} student backend(s)`);
    }
  }

  // ==================== ORDER MANAGEMENT ====================
  private syncPendingOrders() {
    if (this.pendingOrders.size === 0) {
      console.log("✅ No pending orders to sync");
      return;
    }

    console.log(`🔄 Syncing ${this.pendingOrders.size} pending orders`);

    const orders = Array.from(this.pendingOrders.values()).map((po) => ({
      cloudOrderId: po.cloudOrderId,
      order: po.order,
    }));

    this.sendToLocal({
      type: "sync_orders",
      payload: { orders },
      timestamp: Date.now(),
    });
  }


  // ==================== HEARTBEAT & CONNECTION MONITORING ====================
  private startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.localConnection?.readyState === WebSocket.OPEN) {
        try {
          this.localConnection.ping();
          console.log("💓 Heartbeat sent to local");
        } catch (error) {
          console.error("Failed to send heartbeat:", error);
        }
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ==================== HELPER METHODS ====================
  private sendToLocal(message: any) {
    if (this.localConnection?.readyState === WebSocket.OPEN) {
      try {
        this.localConnection.send(JSON.stringify(message));
        console.log(`📤 ⬆️  Sent to local: ${message.type}`);
      } catch (error) {
        console.error("Failed to send to local:", error);
        this.isLocalConnected = false;
      }
    } else {
      console.log(`⚠️  Cannot send to local - not connected`);
    }
  }

  public triggerSync() {
    if (this.isLocalConnected) {
      this.syncPendingOrders();
    } else {
      console.log("⚠️  Cannot sync - local not connected");
    }
  }

  async shutdown() {
    console.log("🛑 Shutting down Cloud WebSocket Server...");
    this.stopHeartbeat();

    if (this.localConnection) {
      this.localConnection.close();
    }

    this.studentConnections.forEach((conn) => {
      conn.close();
    });

    this.studentConnections.clear();
    this.pendingOrders.clear();

    console.log("✅ Cloud WebSocket Server shut down");
  }
}

// ==================== REGISTER FUNCTION ====================
export async function registerCloudWebSocket(app: FastifyInstance) {
  console.log("🔧 Registering Cloud WebSocket Server...");
  const cloudWS = new CloudWebSocketServer(app);
  await cloudWS.initialize();
  return cloudWS;
}
