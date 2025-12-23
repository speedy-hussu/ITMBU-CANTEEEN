import { LocalWebSocketServer } from "./index";
import type { Order, OrderStatus } from "@shared/types/order.types";
import { OrderModel } from "../../database/models/order.model";

export const kdsHandlers = {
  async updateOrderStatus(payload: any, server: LocalWebSocketServer) {
    const { orderId, status } = payload;
    const order = server.getOrders().get(orderId);

    if (!order) {
      console.log(`⚠️  Order not found: ${orderId}`);
      return;
    }

    // ✅ Update with proper immutability
    const updatedOrder: Order = {
      ...order,
      status: status as OrderStatus,
    };

    server.setOrder(orderId, updatedOrder);

    console.log(`📝 KDS: Order #${order.token} → ${status}`);

    // Broadcast status update
    server.broadcast({
      type: "update_status",
      payload: { orderId, status },
      timestamp: Date.now(),
    });
  },

  async completeOrder(payload: any, server: LocalWebSocketServer) {
    console.log("🔵 completeOrder handler called");
    console.log("   Payload:", JSON.stringify(payload, null, 2));

    // ✅ Handle orderId from payload
    const orderId = payload.orderId;

    await OrderModel.findByIdAndUpdate(
      orderId,
      {
        $set: {
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
        },
      },
      { new: true }
    );

    console.log("   Extracted orderId:", orderId);

    if (!orderId) {
      console.log("❌ No orderId provided");
      return;
    }

    const order = server.getOrders().get(orderId);

    console.log("   Order found:", order ? "YES" : "NO");

    if (!order) {
      console.log(`⚠️  Order not found: ${orderId}`);
      return;
    }

    // ✅ Mark as completed with proper typing
    const completedOrder: Order = {
      ...order,
      status: "COMPLETED" as OrderStatus,
    };

    server.setOrder(orderId, completedOrder);

    console.log(`✅ KDS: Order completed #${order.token}`);
    console.log("📤 Broadcasting to POS devices...");

    // ✅ Broadcast to POS with correct structure
    const message = {
      type: "order_completed",
      payload: {
        orderId: order._id,
        order: completedOrder,
      },
      timestamp: Date.now(),
    };
    server.broadcastToPOS(message);

    console.log("✅ Broadcast complete");

    // Also update KDS screens
    server.broadcastToKDS({
      type: "order_completed",
      payload: {
        orderId: order._id,
        order: completedOrder,
      },
      timestamp: Date.now(),
    });

    // Optional: Remove completed orders after 5 minutes
    // setTimeout(() => {
    //   server.deleteOrder(orderId);
    //   console.log(`🗑️  Order ${order.token} removed from memory`);
    // }, 300000);
  },
  async cancelOrder(payload: any, server: LocalWebSocketServer) {
    console.log("🔵 cancelledOrder handler called");
    console.log("   Payload:", JSON.stringify(payload, null, 2));

    const orderId = payload.orderId;

    await OrderModel.findByIdAndDelete(orderId);

    console.log("   Extracted orderId:", orderId);

    const order = server.getOrders().get(orderId);

    console.log("Order found:", order ? "YES" : "NO");

    if (!order) {
      console.log(`⚠️  Order not found: ${orderId}`);
      return;
    }

    // remove from memory
    server.deleteOrder(orderId);

    console.log(`❌ KDS: Order cancelled #${order.token}`);
    console.log("📤 Broadcasting to POS devices...");

    const cancelledPayload = {
      type: "order_cancelled",
      payload: {
        orderId: order._id,
        token: order.token,
      },
      timestamp: Date.now(),
    };

    // broadcast to POS
    server.broadcastToPOS(cancelledPayload);

    console.log("✅ Broadcast complete");

    // broadcast to KDS
    server.broadcastToKDS(cancelledPayload);
  },
};
