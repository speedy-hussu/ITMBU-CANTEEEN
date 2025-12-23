import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getItemsController } from "./controllers/item.controller";
import { ItemForm, StockItem } from "@shared/types/item.types";

/**
 * Item routes – mounted with prefix, e.g. `/api/items` in the main app file.
 */
export default async function itemRoutes(app: FastifyInstance) {
  // Fetch all items
  app.get("/getItems", async (req: FastifyRequest, reply: FastifyReply) =>
    getItemsController(app, req, reply)
  );

  // Create a new item
  //   app.post<{ Body: ItemForm & { stock: number; isAvailable?: boolean } }>(
  //     "/",
  //     async (
  //       req: FastifyRequest<{
  //         Body: ItemForm & { stock: number; isAvailable?: boolean };
  //       }>,
  //       reply: FastifyReply
  //     ) => addItemController(app, req, reply)
  //   );

  // Update item by ID
  //   app.put<{ Params: { id: string }; Body: Partial<StockItem> }>(
  //     "/:id",
  //     async (
  //       req: FastifyRequest<{ Params: { id: string }; Body: Partial<StockItem> }>,
  //       reply: FastifyReply
  //     ) => updateItemController(app, req, reply)
  //   );

  // Delete item by ID
  //   app.delete<{ Params: { id: string } }>(
  //     "/:id",
  //     async (
  //       req: FastifyRequest<{ Params: { id: string } }>,
  //       reply: FastifyReply
  //     ) => deleteItemController(app, req, reply)
  //   );
}
