import { create } from "zustand";
import type { Order, OrderStatus } from "@shared/types";
interface OrderStore {
  orders: Order[];

  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],

  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),

  updateOrderStatus: (id, status) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order._id === id ? { ...order, status } : order
      ),
    })),
}));
