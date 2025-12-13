import { create } from "zustand";
import type { Order, OrderStatus } from "@shared/types/order.types";
import type { KdsItem } from "@shared/types/item.types";

// Extend KdsItem to include checked state for the store
interface CheckableOrderItem extends KdsItem {
  checked: boolean;
}

interface CheckableOrder extends Omit<Order, "items"> {
  items: CheckableOrderItem[];
}

interface OrdersState {
  orders: CheckableOrder[];
  TotalOrders: number;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  removeOrder: (id: string) => void;
  emptyOrders: () => void;
  setOrders: (orders: Order[]) => void;
  toggleItemChecked: (orderId: string, itemIndex: number) => void;
  resetItemChecks: (orderId: string) => void;
  isAllItemsChecked: (orderId: string) => boolean;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  TotalOrders: 0,

  addOrder: (newOrder) =>
    set((state) => {
      const orderWithStatus: CheckableOrder = {
        ...newOrder,
        status: newOrder.status || "PENDING",
        items: newOrder.items.map((item) => ({ ...item, checked: false })),
      };

      const existingOrderIndex = state.orders.findIndex(
        (order) => order._id === orderWithStatus._id
      );

      if (existingOrderIndex !== -1) {
        const updatedOrders = [...state.orders];
        const existingOrder = { ...updatedOrders[existingOrderIndex] };

        orderWithStatus.items.forEach((newItem) => {
          const existingItemIndex = existingOrder.items.findIndex(
            (i) => i.name === newItem.name
          );

          if (existingItemIndex !== -1) {
            existingOrder.items[existingItemIndex] = {
              ...existingOrder.items[existingItemIndex],
              quantity:
                existingOrder.items[existingItemIndex].quantity +
                newItem.quantity,
            };
          } else {
            existingOrder.items.push({ ...newItem, checked: false });
          }
        });

        existingOrder.status = orderWithStatus.status;
        updatedOrders[existingOrderIndex] = existingOrder;

        return { orders: updatedOrders };
      } else {
        return {
          orders: [...state.orders, orderWithStatus],
          TotalOrders: state.TotalOrders + 1,
        };
      }
    }),

  updateOrder: (id, updates) =>
    set((state) => {
      const orderIndex = state.orders.findIndex((o) => o._id === id);
      if (orderIndex === -1) return state;

      const updatedOrders = [...state.orders];
      const order = { ...updatedOrders[orderIndex] };

      // Update all provided fields except items (handle separately)
      if (updates.status) order.status = updates.status;
      if (updates.totalAmount !== undefined)
        order.totalAmount = updates.totalAmount;
      if (updates.token) order.token = updates.token;
      if (updates.source) order.source = updates.source;
      if (updates.synced !== undefined) order.synced = updates.synced;
      if (updates.createdAt) order.createdAt = updates.createdAt;

      // Special handling for items to preserve checked state
      if (updates.items) {
        order.items = updates.items.map((newItem) => {
          const existingItem = order.items.find((i) => i.name === newItem.name);
          return {
            ...newItem,
            checked: existingItem?.checked ?? false,
          };
        });
      }

      updatedOrders[orderIndex] = order;
      return { orders: updatedOrders };
    }),

  removeOrder: (id) =>
    set((state) => {
      const filteredOrders = state.orders.filter((o) => o._id !== id);
      return {
        orders: filteredOrders,
        TotalOrders: filteredOrders.length,
      };
    }),

  emptyOrders: () =>
    set({
      orders: [],
      TotalOrders: 0,
    }),

  setOrders: (orders) =>
    set({
      orders: orders.map((order) => ({
        ...order,
        items: order.items.map((item) => ({
          ...item,
          checked: (item as any).checked ?? false,
        })),
      })),
      TotalOrders: orders.length,
    }),

  toggleItemChecked: (orderId, itemIndex) =>
    set((state) => {
      const orderIndex = state.orders.findIndex((o) => o._id === orderId);
      if (orderIndex === -1) return state;

      const updatedOrders = [...state.orders];
      const order = { ...updatedOrders[orderIndex] };
      const updatedItems = [...order.items];

      if (itemIndex >= 0 && itemIndex < updatedItems.length) {
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          checked: !updatedItems[itemIndex].checked,
        };
      }

      order.items = updatedItems;
      updatedOrders[orderIndex] = order;

      return { orders: updatedOrders };
    }),

  resetItemChecks: (orderId) =>
    set((state) => {
      const orderIndex = state.orders.findIndex((o) => o._id === orderId);
      if (orderIndex === -1) return state;

      const updatedOrders = [...state.orders];
      const order = { ...updatedOrders[orderIndex] };

      order.items = order.items.map((item) => ({
        ...item,
        checked: false,
      }));
      updatedOrders[orderIndex] = order;

      return { orders: updatedOrders };
    }),

  isAllItemsChecked: (orderId) => {
    const order = get().orders.find((o) => o._id === orderId);
    if (!order || order.items.length === 0) return false;
    return order.items.every((item) => item.checked === true);
  },

  updateOrderStatus: (orderId, status) =>
    set((state) => {
      const orderIndex = state.orders.findIndex((o) => o._id === orderId);
      if (orderIndex === -1) return state;

      const updatedOrders = [...state.orders];
      updatedOrders[orderIndex] = {
        ...updatedOrders[orderIndex],
        status,
      };

      return { orders: updatedOrders };
    }),
}));
