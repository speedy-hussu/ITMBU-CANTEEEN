import type { BaseItem, CartItem, KdsItem } from "./item.types";
// Common enums
export type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED";
export type OrderSource = "POS" | "STUDENT" | "ADMIN";

// Item inside an order must at minimum have quantity
export interface OrderItem extends BaseItem {
  quantity: number;
}

// Generic order shape – items can be any OrderItem extension
export interface OrderBase<I extends OrderItem> {
  _id: string;
  token: string;
  items: I[];
  totalAmount: number;
  status: OrderStatus;
  source?: OrderSource;
  synced?: boolean;
  createdAt?: string;
}

// Concrete specialisations
export type PosOrder = OrderBase<CartItem>; // POS / Student front-ends
export type KdsOrder = OrderBase<KdsItem>; // Kitchen Display System
export type AdminOrder = OrderBase<CartItem>; // Admin dashboards

// DB representation can carry Mongo _id etc.
export type DbOrder = OrderBase<KdsItem> & { _id?: string };

// Default alias used across the app (currently matches KDS needs)
export type Order = KdsOrder;
