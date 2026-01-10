// ☁️ CLOUD SERVER - WebSocket Handler with Typed Messages
import { FastifyInstance } from "fastify";
import { WebSocket } from "ws";
import {
  WebSocketMessageBuilder,
  parseWebSocketMessage,
  type OrderAckPayload,
} from "../../../../shared/types/websocket.types";
import mongoose from "mongoose";

interface PendingOrder {
  cloudOrderId: string;
  order: any;
  timestamp: number;
  attempts: number;
  status: "NOT RECEIVED BY KDS";
}

export class CloudWebSocketServer {
  private localConnection: WebSocket | null = null;
  private studentConnections: Set<WebSocket> = new Set();
  private activeStudents: Map<string, WebSocket> = new Map(); // Map enrollmentNo to WebSocket for targeted messaging
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
            ? "Order cached - KDS is offline"
            : "Order sent to KDS",
        });
      } catch (error) {
        console.error("Error creating order:", error);
        return reply.code(500).send({
          success: false,
          error: "Failed to create order",
        });
      }
    });

    // Status endpoint
    this.app.get("/api/status", async () => ({
      canteenOnline: this.isLocalConnected,
      kdsOnline: this.isLocalConnected,
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

    if (this.localConnection) {
      console.log("⚠️  Replacing existing local connection");
      this.localConnection.close();
    }

    this.localConnection = socket;
    this.isLocalConnected = true;

    console.log("✅ Local server connected to cloud!\n");
    console.log("✅ KDS is now ONLINE and accepting orders\n");

    // ✅ Notify all students that KDS is online
    this.broadcastToStudents(
      WebSocketMessageBuilder.kdsStatus(true, "KDS is now online")
    );

    this.startHeartbeat();

    // Sync pending orders when KDS comes back online
    this.syncPendingOrders();

    socket.on("message", (data: Buffer) => {
      try {
        const message: any = JSON.parse(data.toString());
        this.handleLocalMessage(message);
      } catch (error) {
        console.error("❌ Error parsing local message:", error);
      }
    });

    socket.on("close", (code: number, reason: Buffer) => {
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("❌ Local server disconnected from cloud");
      console.log("❌ KDS is now OFFLINE");
      console.log(`   Code: ${code}, Reason: ${reason.toString() || "None"}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      this.isLocalConnected = false;
      this.localConnection = null;
      this.stopHeartbeat();

      // ✅ Notify all students that KDS is offline
      this.broadcastToStudents(
        WebSocketMessageBuilder.kdsStatus(false, "KDS went offline")
      );
    });

    socket.on("error", (error: Error) => {
      console.error("❌ Local WebSocket error:", error.message);
    });

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

  private handleOrderAcknowledgment(payload: OrderAckPayload) {
    const { cloudOrderId, success, localOrderId, error } = payload;

    if (success && cloudOrderId) {
      // Check if this was a pending order being synced
      const pendingOrder = this.pendingOrders.get(cloudOrderId);
      if (pendingOrder && pendingOrder.status === "NOT RECEIVED BY KDS") {
        console.log(
          `✅ Order synced successfully: ${cloudOrderId} (Local ID: ${pendingOrder.order.token}) - Status changed from "NOT RECEIVED BY KDS" to "PENDING"`
        );
      } else {
        console.log(
          `✅ Order acknowledged: ${cloudOrderId} (Local ID: ${
            pendingOrder?.order?.token || localOrderId
          })`
        );
      }

      this.pendingOrders.delete(cloudOrderId);

      // ✅ Use enrollment number for targeted messaging
      const enrollmentNo = pendingOrder?.order?.enrollmentNo;
      if (enrollmentNo) {
        const studentSocket = this.activeStudents.get(enrollmentNo);
        if (studentSocket && studentSocket.readyState === WebSocket.OPEN) {
          studentSocket.send(
            JSON.stringify(
              WebSocketMessageBuilder.orderAck(
                cloudOrderId,
                true,
                pendingOrder?.order?.token || localOrderId
              )
            )
          );
          console.log(
            `📤 Sent targeted order acknowledgment to enrollment: ${enrollmentNo}`
          );
        } else {
          console.warn(
            `⚠️  Student ${enrollmentNo} not connected, falling back to broadcast`
          );
          this.broadcastToStudents(
            WebSocketMessageBuilder.orderAck(
              cloudOrderId,
              true,
              pendingOrder?.order?.token || localOrderId
            )
          );
        }
      } else {
        // No enrollment number, broadcast to all
        this.broadcastToStudents(
          WebSocketMessageBuilder.orderAck(
            cloudOrderId,
            true,
            pendingOrder?.order?.token || localOrderId
          )
        );
      }
    } else {
      console.error(`❌ Order acknowledgment failed: ${cloudOrderId}`, error);
      // ✅ Use typed message builder
      this.broadcastToStudents(
        WebSocketMessageBuilder.orderAck(
          cloudOrderId || "",
          false,
          undefined,
          error || "Unknown error"
        )
      );
    }
  }

  private handleOrderCompleted(payload: any) {
    console.log("✅ Order completed from local:", payload);

    // Use enrollment number for targeted messaging
    const enrollmentNo = payload.enrollmentNo;
    if (enrollmentNo) {
      const studentSocket = this.activeStudents.get(enrollmentNo);
      if (studentSocket && studentSocket.readyState === WebSocket.OPEN) {
        studentSocket.send(
          JSON.stringify({
            type: "order_completed",
            payload: {
              cloudOrderId: payload.cloudOrderId,
              localOrderId: payload.localOrderId,
              token: payload.token,
            },
            timestamp: Date.now(),
          })
        );
        console.log(
          `📤 Sent targeted order completion to enrollment: ${enrollmentNo}`
        );
      } else {
        console.warn(
          `⚠️  Student ${enrollmentNo} not connected, falling back to broadcast`
        );
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
    } else {
      // No enrollment number, broadcast to all
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
  }

  private handleOrderCancelled(payload: any) {
    console.log("❌ Order cancelled from local:", payload);

    // Use enrollment number for targeted messaging
    const enrollmentNo = payload.enrollmentNo;
    if (enrollmentNo) {
      const studentSocket = this.activeStudents.get(enrollmentNo);
      if (studentSocket && studentSocket.readyState === WebSocket.OPEN) {
        studentSocket.send(
          JSON.stringify({
            type: "order_cancelled",
            payload: {
              cloudOrderId: payload.cloudOrderId,
              localOrderId: payload.localOrderId,
              token: payload.token,
            },
            timestamp: Date.now(),
          })
        );
        console.log(
          `📤 Sent targeted order cancellation to enrollment: ${enrollmentNo}`
        );
      } else {
        console.warn(
          `⚠️  Student ${enrollmentNo} not connected, falling back to broadcast`
        );
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
    } else {
      // No enrollment number, broadcast to all
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
  }

  private handleStatusUpdate(payload: any) {
    console.log("📦 Order status update from local:", payload);

    // Try to get enrollment number from payload first, then from pending orders
    let enrollmentNo = payload.enrollmentNo;

    if (!enrollmentNo && payload.cloudOrderId) {
      // If no enrollment in payload, try to find it from pending orders
      const pendingOrder = this.pendingOrders.get(payload.cloudOrderId);
      if (pendingOrder?.order?.enrollmentNo) {
        enrollmentNo = pendingOrder.order.enrollmentNo;
        console.log(
          `🔍 Found enrollment number from pending order: ${enrollmentNo}`
        );
      }
    }

    if (enrollmentNo) {
      const studentSocket = this.activeStudents.get(enrollmentNo);
      if (studentSocket && studentSocket.readyState === WebSocket.OPEN) {
        studentSocket.send(
          JSON.stringify({
            type: "update_status",
            payload,
            timestamp: Date.now(),
          })
        );
        console.log(
          `📤 Sent targeted status update to enrollment: ${enrollmentNo}`
        );
      } else {
        console.warn(
          `⚠️  Student ${enrollmentNo} not connected, falling back to broadcast`
        );
        this.broadcastToStudents({
          type: "update_status",
          payload,
          timestamp: Date.now(),
        });
      }
    } else {
      // No enrollment number found, broadcast to all
      console.warn(
        `⚠️  No enrollment number found for status update, broadcasting to all`
      );
      this.broadcastToStudents({
        type: "update_status",
        payload,
        timestamp: Date.now(),
      });
    }
  }

  // ==================== STUDENT BACKEND CONNECTION ====================
  private handleStudentConnection(socket: WebSocket) {
    console.log("🎓 Student backend connected to cloud");

    this.studentConnections.add(socket);

    // ✅ Send initial connection with KDS status using typed builder
    socket.send(
      JSON.stringify(
        WebSocketMessageBuilder.connectionEstablished(this.isLocalConnected)
      )
    );

    socket.on("message", async (data: Buffer) => {
      try {
        const message = parseWebSocketMessage(data.toString());
        if (!message) return;

        if (message.type === "student_order") {
          console.log("📥 Student order received:", message);

          // Extract enrollment number from order for targeted messaging
          const enrollmentNo = message.payload.order.enrollmentNo;

          // Store user connection mapping using enrollment number as key
          this.activeStudents.set(enrollmentNo, socket);
          console.log(`📡 Connection mapped to Enrollment: ${enrollmentNo}`);

          // Process the order regardless of KDS status
          const result = await this.receiveStudentOrder(message.payload.order);

          // ✅ Confirm reception using typed builder
          socket.send(
            JSON.stringify(
              WebSocketMessageBuilder.studentOrderReceived(
                result.cloudOrderId,
                true,
                result.queued
              )
            )
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

      // Remove from activeStudents map - find and remove by comparing sockets
      for (const [enrollmentNo, ws] of this.activeStudents.entries()) {
        if (ws === socket) {
          this.activeStudents.delete(enrollmentNo);
          console.log(
            `🗑️ Removed enrollment ${enrollmentNo} from active students map`
          );
          break;
        }
      }
    });

    socket.on("error", (error: Error) => {
      console.error("❌ Student connection error:", error.message);
      this.studentConnections.delete(socket);

      // Remove from activeStudents map on error
      for (const [enrollmentNo, ws] of this.activeStudents.entries()) {
        if (ws === socket) {
          this.activeStudents.delete(enrollmentNo);
          break;
        }
      }
    });
  }

  async receiveStudentOrder(order: any): Promise<{
    queued: boolean;
    cloudOrderId: string;
  }> {
    // Generate MongoDB ObjectId in cloud backend only
    const mongoId = new mongoose.Types.ObjectId();
    const cloudOrderId = mongoId.toString();

    console.log("📦 Processing order:", {
      cloudOrderId,
      mongoId,
      orderData: order,
    });

    if (this.isLocalConnected) {
      // ✅ Use typed message builder
      this.sendToLocal(
        WebSocketMessageBuilder.studentOrder(cloudOrderId, order)
      );

      console.log(`📤 Student order sent to KDS: ${cloudOrderId}`);
      return { queued: false, cloudOrderId };
    } else {
      // Store order in cache when KDS is offline
      const pendingOrder: PendingOrder = {
        cloudOrderId,
        order,
        timestamp: Date.now(),
        attempts: 0,
        status: "NOT RECEIVED BY KDS",
      };

      this.pendingOrders.set(cloudOrderId, pendingOrder);
      console.log(`💾 Order cached - KDS offline: ${cloudOrderId}`);

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

  // ==================== HEARTBEAT ====================
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
    }, 5000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ==================== HELPER METHODS ====================
  private syncPendingOrders() {
    if (this.pendingOrders.size === 0) {
      console.log("📋 No pending orders to sync");
      return;
    }

    console.log(
      `🔄 Syncing ${this.pendingOrders.size} pending orders to KDS...`
    );

    const ordersToSync = Array.from(this.pendingOrders.entries());

    ordersToSync.forEach(([cloudOrderId, pendingOrder]) => {
      console.log(`📤 Syncing order: ${cloudOrderId}`);

      // Send the cached order to KDS
      this.sendToLocal(
        WebSocketMessageBuilder.studentOrder(cloudOrderId, pendingOrder.order)
      );

      // Update the pending order to track sync attempt
      pendingOrder.attempts++;
    });

    console.log(`📤 Sent ${ordersToSync.length} orders to KDS for sync`);
  }

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
      throw new Error("KDS is not connected");
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
    this.activeStudents.clear(); // Clear active students map
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
