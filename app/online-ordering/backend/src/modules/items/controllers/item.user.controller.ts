// modules/items/controllers/item.user.controller.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import Item from "../../../database/models/item.model";

export async function getItemsController(
  app: FastifyInstance,
  _req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    console.log("🔍 Controller: Fetching items...");
    console.log("📊 DB Connection state:", Item.db.readyState);
    console.log("📦 Collection:", Item.collection.name);
    
    const items = await Item.find().lean();
    console.log("✅ Items found:", items.length);
    
    return reply.send(items);
  } catch (error: any) {
    console.error("❌ Controller Error:", error.message);
    console.error("Stack:", error.stack);
    app.log.error(error);
    return reply.status(500).send({ 
      error: "Failed to fetch items",
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
