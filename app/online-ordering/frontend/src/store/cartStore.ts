// store/cartStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartInput } from "@shared/types/item.types";

interface CartState {
  cart: CartItem[];
  totalItems: number;
}
interface CartActions {
  addToCart: (item: CartInput) => void;
  removeFromCart: (item: CartInput) => void;
  emptyCart: () => void;
  getCartTotal: () => number;
}
type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      totalItems: 0,

      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find((c) => c.name === item.name);

          if (existing) {
            return {
              cart: state.cart.map((c) =>
                c.name === item.name
                  ? {
                      ...c,
                      quantity: c.quantity + 1,
                      total: (c.quantity + 1) * c.price,
                    }
                  : c
              ),
            };
          }
          return {
            cart: [...state.cart, { ...item, quantity: 1, total: item.price }],
            totalItems: state.totalItems + 1,
          };
        }),

      removeFromCart: (item) =>
        set((state) => {
          const existing = state.cart.find((c) => c.name === item.name);
          if (!existing) return state;

          if (existing.quantity > 1) {
            return {
              cart: state.cart.map((c) =>
                c.name === item.name
                  ? {
                      ...c,
                      quantity: c.quantity - 1,
                      total: (c.quantity - 1) * c.price,
                    }
                  : c
              ),
            };
          }
          return {
            cart: state.cart.filter((c) => c.name !== item.name),
            totalItems: state.totalItems - 1,
          };
        }),

      getCartTotal: () => get().cart.reduce((t, i) => t + i.total, 0),
      emptyCart: () => set({ cart: [], totalItems: 0 }),
    }),
    { name: "cart-storage" }
  )
);
