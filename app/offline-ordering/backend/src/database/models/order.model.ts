// backend/models/Order.model.ts
import mongoose, { Schema, Model } from "mongoose";
import type { Order } from "@shared/types/order.types";

// Order Item Schema (inline)
const OrderItemSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

// Order Schema (inline)
const OrderSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: any[]) => items && items.length > 0,
        message: "Order must have at least one item",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELLED"],
      default: "PENDING",
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["POS", "STUDENT", "ADMIN"],
      required: true,
    },
    synced: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: String,
      required: true,
    },
    completedAt: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: false,
    _id: false,
  }
);

// Create and export Model
export const OrderModel: Model<Order> =
  mongoose.models.Order ||
  mongoose.model<Order>("CanteenOrder", OrderSchema, "CanteenOrders");
