// backend/websocket/pos.handlers.ts
import { LocalWebSocketServer } from "./index";
import type {
  Order,
  OrderStatus,
  OrderSource,
} from "@shared/types/order.types";
import { OrderModel } from "../../database/models/order.model";
import mongoose from "mongoose";

export const posHandlers = {
  /**
   * Create new order from POS
   * Flow: Generate MongoDB ID → Save to DB → Broadcast to clients
   */
  async createOrder(payload: any, server: LocalWebSocketServer) {
    try {
      const { items, token, total } = payload;

      // Validate payload
      if (!items || items.length === 0) {
        throw new Error("Order must have at least one item");
      }
      if (!token || !token.trim()) {
        throw new Error("Order must have a token");
      }

      // ✅ STEP 1: Generate MongoDB ObjectId FIRST
      const orderId = new mongoose.Types.ObjectId();
      console.log(`🆔 Generated MongoDB ID: ${orderId}`);

      // ✅ STEP 2: Calculate total if not provided
      const calculatedTotal = items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );
      const finalTotal = total || calculatedTotal;

      // ✅ STEP 3: Create order document
      const orderData = {
        _id: orderId.toString(),
        token: token.trim(),
        items: items.map((item: any) => ({
          _id: item._id,
          name: item.name,
          price: Number(item.price),
          category: item.category,
          quantity: Number(item.quantity),
        })),
        totalAmount: finalTotal,
        status: "PENDING" as OrderStatus,
        source: "POS" as OrderSource,
        createdAt: new Date().toISOString(),
      };

      // ✅ STEP 4: Save to MongoDB
      const savedOrder = await OrderModel.create(orderData);
      console.log(`💾 Order saved to DB - #${token} (ID: ${orderId})`);

      // ✅ STEP 5: Create client-friendly order
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

      // ✅ STEP 6: Store in memory for fast access
      server.setOrder(clientOrder._id, clientOrder);

      // ✅ STEP 7: Broadcast to all clients
      server.broadcast({
        type: "new_order",
        payload: { order: clientOrder },
        timestamp: Date.now(),
      });

      console.log(`✅ Order #${token} created and broadcasted`);
      console.log(`   - MongoDB _id: ${orderId}`);
      console.log(`   - Client id: ${clientOrder._id}`);
      console.log(`   - IDs match: ${orderId.toString() === clientOrder._id}`);

      return clientOrder;
    } catch (error) {
      console.error("❌ Failed to create order:", error);

      // Send error back to POS
      server.broadcastToPOS({
        type: "order_error",
        payload: {
          error:
            error instanceof Error ? error.message : "Failed to create order",
        },
        timestamp: Date.now(),
      });

      throw error;
    }
  },

  /**
   * Cancel order from POS
   * Flow: Update DB → Update memory → Broadcast
   */
  async cancelOrder(payload: any, server: LocalWebSocketServer) {
    try {
      const { orderId } = payload;

      if (!orderId) {
        throw new Error("orderId is required");
      }

      console.log(`🗑️  Cancelling order: ${orderId}`);

      // ✅ STEP 1: Update in MongoDB
      const updatedOrder = await OrderModel.findByIdAndUpdate(
        orderId,
        {
          $set: {
            status: "CANCELLED",
            cancelledAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        { new: true }
      );

      if (!updatedOrder) {
        console.log(`⚠️  Order not found in DB: ${orderId}`);
        return;
      }

      console.log(`💾 Order #${updatedOrder.token} cancelled in DB`);

      // ✅ STEP 2: Update in memory
      const memoryOrder = server.getOrders().get(orderId);
      if (memoryOrder) {
        const cancelledOrder: Order = {
          ...memoryOrder,
          status: "CANCELLED" as OrderStatus,
        };
        server.setOrder(orderId, cancelledOrder);
      }

      // ✅ STEP 3: Broadcast cancellation
      server.broadcast({
        type: "order_cancelled",
        payload: { orderId },
        timestamp: Date.now(),
      });

      console.log(`✅ Order #${updatedOrder.token} cancelled successfully`);
    } catch (error) {
      console.error("❌ Failed to cancel order:", error);
      throw error;
    }
  },
};
