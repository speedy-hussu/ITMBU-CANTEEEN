// backend/websocket/cloud.handlers.ts
import { LocalWebSocketServer } from "../local";
import type {
  Order,
  OrderStatus,
  OrderSource,
} from "@shared/types/order.types";
import { OrderModel } from "../../database/models/order.model";
import type { WebSocketMessage } from "../../../../../shared/types/websocket.types";
import mongoose from "mongoose";

export const cloudHandlers = {
  /**
   * Handle incoming student order from cloud
   * Flow: Generate MongoDB ID → Create Order → Save to memory → Broadcast to KDS → Acknowledge to cloud
   */
  async handleStudentOrder(payload: any, server: LocalWebSocketServer) {
    try {
      const { cloudOrderId, order: incomingOrder } = payload;

      // Generate MongoDB ObjectId
      const orderId = new mongoose.Types.ObjectId();
      console.log(`🆔 Generated MongoDB ID: ${orderId}`);

      // Create properly typed order
      const newOrder: Order = {
        _id: orderId.toString(),
        token: incomingOrder.token,
        items: incomingOrder.items.map((item: any) => ({
          _id: item._id,
          name: item.name,
          price: item.price,
          category: item.category,
          quantity: item.quantity,
        })),
        totalAmount:
          incomingOrder.totalAmount ||
          incomingOrder.items.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0
          ),
        status: "PENDING" as OrderStatus,
        source: "STUDENT" as OrderSource,
        createdAt: new Date().toISOString(),
      };
      //order saved to local db
      const savedOrder = await OrderModel.create(newOrder);
      const clientOrder: Order = {
        _id: orderId.toString(),
        token: savedOrder.token,
        items: savedOrder.items,
        totalAmount: savedOrder.totalAmount,
        status: savedOrder.status,
        source: savedOrder.source,
        createdAt: savedOrder.createdAt,
        synced: true,
      };
      // Save to memory
      server.setOrder(clientOrder._id, clientOrder);
      console.log(`💾 Order saved to DB - #${newOrder.token} (ID: ${orderId})`);

      console.log(
        `📦 Student order received: #${newOrder.token} (ID: ${newOrder._id})`
      );

      // Broadcast to KDS
      server.broadcastToKDS({
        type: "new_order",
        payload: { order: newOrder },
        timestamp: Date.now(),
      });

      // Acknowledge to cloud
      server.broadcastToStudent({
        type: "order_ack",
        payload: {
          cloudOrderId,
          success: true,
          localOrderId: newOrder._id,
        },
        timestamp: Date.now(),
      });

      return newOrder;
    } catch (error) {
      console.error("❌ Failed to handle student order:", error);

      // Send failure acknowledgment to cloud
      const { cloudOrderId } = payload;
      server.broadcastToStudent({
        type: "order_ack",
        payload: {
          cloudOrderId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        timestamp: Date.now(),
      });

      throw error;
    }
  },

  /**
   * Handle sync of pending orders from cloud
   * Called when local server reconnects to cloud
   */
  async handleSyncPendingOrders(payload: any, server: LocalWebSocketServer) {
    try {
      const { orders } = payload;
      console.log(`🔄 Received ${orders.length} pending orders from cloud`);

      const results = [];

      for (const orderData of orders) {
        try {
          const order = await cloudHandlers.handleStudentOrder(
            {
              cloudOrderId: orderData.cloudOrderId,
              order: orderData.order,
            },
            server
          );
          results.push({ success: true, order });
        } catch (error) {
          console.error(
            `❌ Failed to sync order ${orderData.cloudOrderId}:`,
            error
          );
          results.push({
            success: false,
            cloudOrderId: orderData.cloudOrderId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      console.log(
        `✅ Synced ${results.filter((r) => r.success).length}/${
          orders.length
        } orders`
      );

      return results;
    } catch (error) {
      console.error("❌ Failed to sync pending orders:", error);
      throw error;
    }
  },

  /**
   * Notify cloud when order is completed
   * Called from KDS when order status changes to COMPLETED
   */
  notifyOrderCompleted(orderId: string, server: LocalWebSocketServer) {
    try {
      const order = server.getOrders().get(orderId);

      if (!order) {
        console.log(
          `⚠️  Order not found for completion notification: ${orderId}`
        );
        return;
      }

      if (!order._id) {
        console.log(`⚠️  Order has no _id for cloud notification: ${orderId}`);
        return;
      }

      const message: WebSocketMessage = {
        type: "order_completed",
        payload: {
          cloudOrderId: order._id,
          localOrderId: orderId,
          token: order.token,
        },
        timestamp: Date.now(),
      };

      server.broadcastToStudent(message);
      console.log(`✅ Notified cloud of completed order: ${order.token}`);
    } catch (error) {
      console.error("❌ Failed to notify order completion:", error);
    }
  },

  /**
   * Notify cloud when order is cancelled
   * Called from KDS or POS when order is cancelled
   */
  notifyOrderCancelled(orderId: string, server: LocalWebSocketServer) {
    try {
      const order = server.getOrders().get(orderId);

      if (!order) {
        console.log(
          `⚠️  Order not found for cancellation notification: ${orderId}`
        );
        return;
      }

      if (!order._id) {
        console.log(`⚠️  Order has no _id for cloud notification: ${orderId}`);
        return;
      }

      const message: WebSocketMessage = {
        type: "order_cancelled",
        payload: {
          cloudOrderId: order._id,
          localOrderId: orderId,
          token: order.token,
        },
        timestamp: Date.now(),
      };

      server.broadcastToStudent(message);
      console.log(`❌ Notified cloud of cancelled order: ${order.token}`);
    } catch (error) {
      console.error("❌ Failed to notify order cancellation:", error);
    }
  },

  /**
   * Notify cloud of order status updates
   * Called when order status changes (PREPARING, READY, etc.)
   */
  notifyOrderStatusUpdate(
    orderId: string,
    status: OrderStatus,
    server: LocalWebSocketServer
  ) {
    try {
      const order = server.getOrders().get(orderId);

      if (!order || !order._id) {
        return;
      }

      const message: WebSocketMessage = {
        type: "update_status",
        payload: {
          cloudOrderId: order._id,
          localOrderId: orderId,
          token: order.token,
          status,
        },
        timestamp: Date.now(),
      };

      server.broadcastToStudent(message);
      console.log(
        `📦 Notified cloud of status update: ${order.token} → ${status}`
      );
    } catch (error) {
      console.error("❌ Failed to notify status update:", error);
    }
  },
};
