// ============================================
// SHARED TYPES (Put in @shared/types/websocket.types.ts)
// ============================================

import type { Order, OrderStatus } from "./order.types";

// ============================================
// WEBSOCKET MESSAGE TYPES
// ============================================

export type WebSocketMessageType =
  | "new_order"
  | "order_completed"
  | "order_cancelled"
  | "update_status"
  | "sync_orders"
  | "sync_request"
  | "order_ack"
  | "student_order";

export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: number;
}

// ============================================
// PAYLOAD TYPES FOR EACH MESSAGE
// ============================================

export interface NewOrderPayload {
  order: Order;
}

export interface OrderCompletedPayload {
  orderId: string; // The order.id field
  order: Order;
}

export interface OrderCancelledPayload {
  orderId: string;
  token: string;
}

export interface UpdateStatusPayload {
  orderId: string;
  token: string;
  status: OrderStatus;
}

export interface SyncOrdersPayload {
  orders: Order[];
}

export interface OrderAckPayload {
  cloudOrderId?: string;
  success: boolean;
  localOrderId?: string;
}

// ============================================
// MESSAGE BUILDERS (Use these to create messages)
// ============================================

export class WebSocketMessageBuilder {
  static newOrder(order: Order): WebSocketMessage<NewOrderPayload> {
    return {
      type: "new_order",
      payload: { order },
      timestamp: Date.now(),
    };
  }

  static orderCompleted(order: Order): WebSocketMessage<OrderCompletedPayload> {
    return {
      type: "order_completed",
      payload: {
        orderId: order._id, // ✅ Use order.id (your primary key)
        order,
      },
      timestamp: Date.now(),
    };
  }

  static orderCancelled(
    orderId: string,
    token: string
  ): WebSocketMessage<OrderCancelledPayload> {
    return {
      type: "order_cancelled",
      payload: { orderId, token },
      timestamp: Date.now(),
    };
  }

  static syncOrders(orders: Order[]): WebSocketMessage<SyncOrdersPayload> {
    return {
      type: "sync_orders",
      payload: { orders },
      timestamp: Date.now(),
    };
  }

  static updateStatus(
    orderId: string,
    token: string,
    status: OrderStatus
  ): WebSocketMessage<UpdateStatusPayload> {
    return {
      type: "update_status",
      payload: { orderId, status, token },
      timestamp: Date.now(),
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createOrderId(): string {
  return `ORD-${Date.now()}`;
}

export function parseWebSocketMessage<T = any>(
  data: string
): WebSocketMessage<T> | null {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to parse WebSocket message:", error);
    return null;
  }
}
