// backend/websocket/index.ts (Refactored)
import { FastifyInstance } from "fastify";
import { WebSocket } from "ws";
import { posHandlers } from "./pos.handlers";
import { kdsHandlers } from "./kds.handlers";
import { syncHandlers } from "./sync.handlers";
import { cloudHandlers } from "../cloud/index";
import type {
  Order,
  OrderStatus,
  OrderSource,
} from "@shared/types/order.types";
import type { WebSocketMessage } from "../../../../../shared/types/index";
import mongoose from "mongoose";

interface Client {
  connection: WebSocket;
  type: "pos" | "kds";
  id: string;
}

export class LocalWebSocketServer {
  private clients: Map<string, Client> = new Map();
  private orders: Map<string, Order> = new Map();
  private cloudConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;

  constructor(private app: FastifyInstance) {}

  async initialize() {
    // Define the WebSocket route for local clients (POS/KDS)
    this.app.get("/ws/local", { websocket: true }, (connection, req) => {
      this.handleConnection(connection, req);
    });
    console.log("✅ Local WebSocket Server initialized (LAN only)");
    this.connectToCloud();
  }

  // ==================== CLOUD CONNECTION MANAGEMENT ====================
  private connectToCloud() {
    const CLOUD_URL = process.env.CLOUD_WS_URL;
    if (!CLOUD_URL) {
      console.log("⚠️  No CLOUD_WS_URL configured, running in offline mode");
      return;
    }
    console.log(`🔄 Connecting to cloud: ${CLOUD_URL}`);
    try {
      this.cloudConnection = new WebSocket(CLOUD_URL);
      this.cloudConnection.on("open", () => {
        console.log("✅ Connected to cloud server");
        this.reconnectAttempts = 0;

        // Send connection confirmation
        //   this.broadcastToStudent({
        //     type: "local_connected",
        //     payload: {
        //       message: "Local server connected",
        //       timestamp: Date.now(),
        //     },
        //     timestamp: Date.now(),
        //   });
      });

      this.cloudConnection.on("message", async (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          console.log(`📨 Message from cloud: ${message.type}`);
          await this.handleCloudMessage(message);
        } catch (error) {
          console.error("Error handling cloud message:", error);
        }
      });

      this.cloudConnection.on("close", () => {
        console.log("❌ Disconnected from cloud server");
        this.cloudConnection = null;
        this.attemptReconnect();
      });

      this.cloudConnection.on("error", (error: Error) => {
        console.error("❌ Cloud connection error:", error.message);
      });

      // Handle ping from cloud (heartbeat)
      this.cloudConnection.on("ping", () => {
        console.log("💓 Heartbeat received from cloud");
        if (this.cloudConnection?.readyState === WebSocket.OPEN) {
          this.cloudConnection.pong();
        }
      });
    } catch (error) {
      console.error("❌ Failed to create cloud connection:", error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        `❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached`
      );
      console.log(`⏰ Will retry in 1 minute...`);

      // Wait 1 minute then reset attempts and try again
      setTimeout(() => {
        console.log("🔄 Resetting reconnection attempts...");
        this.reconnectAttempts = 0;
        this.connectToCloud();
      }, 60000);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(
      `🔄 Reconnecting to cloud in ${delay / 1000}s (attempt ${
        this.reconnectAttempts
      }/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connectToCloud();
    }, delay);
  }

  // ==================== CLOUD MESSAGE ROUTING ====================
  private async handleCloudMessage(message: WebSocketMessage) {
    const { type, payload } = message;

    try {
      switch (type) {
        case "student_order":
          await cloudHandlers.handleStudentOrder(payload, this);
          break;

        case "sync_orders":
          await cloudHandlers.handleSyncPendingOrders(payload, this);
          break;

        default:
          console.warn(`⚠️  Unknown cloud message type: ${type}`);
      }
    } catch (error) {
      console.error(`❌ Error handling cloud message (${type}):`, error);
    }
  }

  /**
   * Send message to cloud server
   * Public method used by handlers
   */
  broadcastToStudent(message: WebSocketMessage) {
    if (this.cloudConnection?.readyState === WebSocket.OPEN) {
      try {
        this.cloudConnection.send(JSON.stringify(message));
        console.log(`📤 Sent to cloud: ${message.type}`);
      } catch (error) {
        console.error("Failed to send to cloud:", error);
        // Connection might be broken, trigger reconnect
        this.cloudConnection = null;
        this.attemptReconnect();
      }
    } else {
      console.log(
        `⚠️  Cannot send to cloud - not connected (readyState: ${this.cloudConnection?.readyState})`
      );
    }
  }

  // ==================== LOCAL CLIENT CONNECTION MANAGEMENT ====================
  private handleConnection(connection: WebSocket, req: any) {
    const clientType = req.query.type as "pos" | "kds";
    const clientId = `${clientType}-${Date.now()}`;

    if (!clientType || !["pos", "kds"].includes(clientType)) {
      connection.close(1008, "Invalid client type");
      return;
    }

    const client: Client = { connection, type: clientType, id: clientId };
    this.clients.set(clientId, client);

    console.log(`🔌 ${clientType.toUpperCase()} connected: ${clientId}`);

    // Sync orders based on client type
    if (clientType === "kds") {
      // KDS sees ALL active orders
      syncHandlers.syncOrders(connection, Array.from(this.orders.values()));
    } else if (clientType === "pos") {
      // POS sees only its own orders (optional - for order history)
      const posOrders = Array.from(this.orders.values()).filter(
        (order) => order.source === "POS"
      );
      syncHandlers.syncOrders(connection, posOrders);
    }

    connection.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        await this.routeMessage(message, client);
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });

    connection.on("close", () => {
      console.log(`🔌 ${clientType.toUpperCase()} disconnected: ${clientId}`);
      this.clients.delete(clientId);
    });
  }

  // ==================== LOCAL MESSAGE ROUTING ====================
  private async routeMessage(message: any, client: Client) {
    const { type, payload } = message;

    console.log(
      `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 RECEIVED MESSAGE
   From: ${client.type.toUpperCase()}
   Type: ${type}
   Payload:`,
      JSON.stringify(payload, null, 2),
      `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `
    );

    try {
      switch (type) {
        case "new_order":
          if (client.type === "pos") {
            console.log("✅ Routing to posHandlers.createOrder");
            await posHandlers.createOrder(payload, this);
          }
          break;

        case "order_completed":
          console.log("🔔 order_completed case triggered");
          console.log("   Client type:", client.type);

          if (client.type === "kds") {
            console.log("✅ Calling kdsHandlers.completeOrder");
            await kdsHandlers.completeOrder(payload, this);
            console.log("✅ kdsHandlers.completeOrder finished");

            // Notify cloud of completion
            if (payload.orderId) {
              cloudHandlers.notifyOrderCompleted(payload.orderId, this);
            }
          } else {
            console.log("❌ Client type is NOT kds, skipping handler");
          }
          break;

        case "order_cancelled":
          console.log("🔔 order_cancelled case triggered");
          console.log("   Client type:", client.type);

          if (client.type === "kds") {
            // Cancelled from KDS (e.g., no items available)
            console.log("🔔 order_cancelled from KDS");
            await kdsHandlers.cancelOrder(payload, this);
          } else if (client.type === "pos") {
            // Cancelled from POS (e.g., wrong order)
            console.log("🔔 order_cancelled from POS");
            await posHandlers.cancelOrder(payload, this);
          }

          // Notify cloud of cancellation
          if (payload.orderId) {
            cloudHandlers.notifyOrderCancelled(payload.orderId, this);
          }
          break;

        case "update_status":
          if (client.type === "kds") {
            await kdsHandlers.updateOrderStatus(payload, this);

            // Notify cloud of status update
            if (payload.orderId && payload.status) {
              cloudHandlers.notifyOrderStatusUpdate(
                payload.orderId,
                payload.status,
                this
              );
            }
          }
          break;

        case "sync_request":
          if (client.type === "kds") {
            await syncHandlers.syncOrders(
              client.connection,
              Array.from(this.orders.values())
            );
          } else if (client.type === "pos") {
            const posOrders = Array.from(this.orders.values()).filter(
              (order) => order.source === "POS"
            );
            await syncHandlers.syncOrders(client.connection, posOrders);
          }
          break;

        default:
          console.warn("⚠️  Unknown message type:", type);
      }
    } catch (error) {
      console.error(`❌ Error routing message (${type}):`, error);
    }
  }

  // ==================== BROADCASTING METHODS ====================
  broadcastToKDS(message: any) {
    const data = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (
        client.type === "kds" &&
        client.connection.readyState === WebSocket.OPEN
      ) {
        client.connection.send(data);
        sentCount++;
      }
    });

    if (sentCount > 0) {
      console.log(`📤 Sent to ${sentCount} KDS device(s)`);
    }
  }

  broadcastToPOS(message: any) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 BROADCASTING TO POS
   Message type: ${message.type}
  `);

    const data = JSON.stringify(message);
    let sentCount = 0;

    console.log(`   Total clients connected: ${this.clients.size}`);

    this.clients.forEach((client, id) => {
      console.log(
        `   Client ${id}: type=${client.type}, readyState=${client.connection.readyState}`
      );

      if (
        client.type === "pos" &&
        client.connection.readyState === WebSocket.OPEN
      ) {
        console.log(`   ✅ Sending to POS: ${id}`);
        client.connection.send(data);
        sentCount++;
      }
    });

    console.log(`✅ Sent to ${sentCount} POS device(s)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
  }

  broadcast(message: any, excludeId?: string) {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (
        client.id !== excludeId &&
        client.connection.readyState === WebSocket.OPEN
      ) {
        client.connection.send(data);
      }
    });
  }

  // ==================== ORDER MANAGEMENT ====================
  getOrders() {
    return this.orders;
  }

  setOrder(orderId: string, order: Order) {
    this.orders.set(orderId, order);
  }

  deleteOrder(orderId: string) {
    this.orders.delete(orderId);
  }
  // ==================== CONNECTION STATUS ====================
  isCloudConnected(): boolean {
    return this.cloudConnection?.readyState === WebSocket.OPEN;
  }

  getCloudConnectionStatus(): {
    connected: boolean;
    readyState: number | null;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isCloudConnected(),
      readyState: this.cloudConnection?.readyState ?? null,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export async function registerLocalWebSocket(app: FastifyInstance) {
  const localWS = new LocalWebSocketServer(app);
  await localWS.initialize();
}
