// ============================================
// SHARED TYPES (@shared/types/websocket.types.ts)
// ============================================

import type { Order, OrderStatus } from "./order.types";

// ============================================
// WEBSOCKET MESSAGE TYPES
// ============================================

export type WebSocketMessageType =
  | "local_ws_connected"
  | "cloud_ws_connected"
  | "connection_established" // ✅ NEW: Initial connection with status
  | "kds_status" // ✅ NEW: KDS online/offline status updates
  | "student_order" // ✅ NEW: Order from student to cloud
  | "student_order_received" // ✅ NEW: Cloud confirms order reception
  | "order_rejected" // ✅ NEW: Order rejected (KDS offline)
  | "new_order"
  | "order_completed"
  | "order_cancelled"
  | "update_status"
  | "sync_orders"
  | "sync_request"
  | "order_ack"
  | "pong"
  | "ping";

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
  orderId: string;
  order: Order;
  token?: string;
  cloudOrderId?: string;
  localOrderId?: string;
}

export interface OrderCancelledPayload {
  orderId: string;
  token: string;
  cloudOrderId?: string;
  localOrderId?: string;
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
  error?: string;
}

// ✅ NEW: Connection establishment payload
export interface ConnectionEstablishedPayload {
  message: string;
  kdsOnline: boolean;
  canteenOnline: boolean;
}

// ✅ NEW: KDS status update payload
export interface KDSStatusPayload {
  online: boolean;
  message: string;
}

// ✅ NEW: Student order payload
export interface StudentOrderPayload {
  cloudOrderId: string;
  order: any; // Your order data
}

// ✅ NEW: Student order received confirmation
export interface StudentOrderReceivedPayload {
  cloudOrderId: string;
  success: boolean;
  queued?: boolean;
}

// ✅ NEW: Order rejected payload
export interface OrderRejectedPayload {
  success: false;
  error: string;
  message: string;
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
        orderId: order._id,
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

  // ✅ NEW: Connection established message
  static connectionEstablished(
    kdsOnline: boolean
  ): WebSocketMessage<ConnectionEstablishedPayload> {
    return {
      type: "connection_established",
      payload: {
        message: "Connected to cloud server",
        kdsOnline,
        canteenOnline: kdsOnline,
      },
      timestamp: Date.now(),
    };
  }

  // ✅ NEW: KDS status update message
  static kdsStatus(
    online: boolean,
    message?: string
  ): WebSocketMessage<KDSStatusPayload> {
    return {
      type: "kds_status",
      payload: {
        online,
        message:
          message || (online ? "KDS is now online" : "KDS is now offline"),
      },
      timestamp: Date.now(),
    };
  }

  // ✅ NEW: Student order message
  static studentOrder(
    cloudOrderId: string,
    order: any
  ): WebSocketMessage<StudentOrderPayload> {
    return {
      type: "student_order",
      payload: {
        cloudOrderId,
        order,
      },
      timestamp: Date.now(),
    };
  }

  // ✅ NEW: Student order received confirmation
  static studentOrderReceived(
    cloudOrderId: string,
    success: boolean,
    queued?: boolean
  ): WebSocketMessage<StudentOrderReceivedPayload> {
    return {
      type: "student_order_received",
      payload: {
        cloudOrderId,
        success,
        queued,
      },
      timestamp: Date.now(),
    };
  }

  // ✅ NEW: Order rejected message
  static orderRejected(
    error: string,
    message?: string
  ): WebSocketMessage<OrderRejectedPayload> {
    return {
      type: "order_rejected",
      payload: {
        success: false,
        error,
        message: message || "Order rejected - KDS is offline",
      },
      timestamp: Date.now(),
    };
  }

  // ✅ NEW: Order acknowledgment
  static orderAck(
    cloudOrderId: string,
    success: boolean,
    localOrderId?: string,
    error?: string
  ): WebSocketMessage<OrderAckPayload> {
    return {
      type: "order_ack",
      payload: {
        cloudOrderId,
        success,
        localOrderId,
        error,
      },
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

export function createCloudOrderId(): string {
  return `CLOUD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

// ✅ NEW: Type guards for better type safety
export function isConnectionEstablished(
  msg: WebSocketMessage
): msg is WebSocketMessage<ConnectionEstablishedPayload> {
  return msg.type === "connection_established";
}

export function isKDSStatus(
  msg: WebSocketMessage
): msg is WebSocketMessage<KDSStatusPayload> {
  return msg.type === "kds_status";
}

export function isStudentOrder(
  msg: WebSocketMessage
): msg is WebSocketMessage<StudentOrderPayload> {
  return msg.type === "student_order";
}

export function isOrderRejected(
  msg: WebSocketMessage
): msg is WebSocketMessage<OrderRejectedPayload> {
  return msg.type === "order_rejected";
}

export function isOrderAck(
  msg: WebSocketMessage
): msg is WebSocketMessage<OrderAckPayload> {
  return msg.type === "order_ack";
}
