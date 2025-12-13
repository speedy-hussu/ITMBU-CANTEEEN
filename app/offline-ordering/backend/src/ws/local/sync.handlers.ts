import { WebSocket } from "ws";

export const syncHandlers = {
  syncOrders(connection: WebSocket, orders: any[]) {
    // Filter active orders only
    const activeOrders = orders.filter(
      (order) => !["completed", "cancelled"].includes(order.status)
    );

    const message = {
      type: "sync_orders",
      payload: { orders: activeOrders },
      timestamp: Date.now(),
    };

    if (connection.readyState === 1) {
      connection.send(JSON.stringify(message));
    }

    console.log(`🔄 Synced ${activeOrders.length} orders to client`);
  },
};
