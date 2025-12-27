import { create } from "zustand";
import type { Order, OrderStatus } from "@shared/types";

interface OrderStore {
  orders: Order[];

  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateOrderWithMongoId: (
    tokenId: string,
    mongoId: string,
    status: OrderStatus
  ) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],

  addOrder: (order: Order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),

  updateOrderStatus: (id: string, status: OrderStatus) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order._id === id || order.token === id ? { ...order, status } : order
      ),
    })),

  updateOrderWithMongoId: (
    tokenId: string,
    mongoId: string,
    status: OrderStatus
  ) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order._id === tokenId || order.token === tokenId
          ? { ...order, _id: mongoId, status }
          : order
      ),
    })),
}));
