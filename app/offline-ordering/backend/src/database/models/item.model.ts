import mongoose from "mongoose";
import itemSchema from "@shared/schemas/item.schema";

const ItemSchema = new mongoose.Schema(itemSchema, {
  timestamps: true,
});

export default mongoose.model("Item", ItemSchema);
