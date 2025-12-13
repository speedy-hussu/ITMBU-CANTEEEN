import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import Item from "../../../database/models/item.model";

/**
 * Fetch all items
 */
export async function getItemsController(
  app: FastifyInstance,
  _req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const items = await Item.find().lean();
    return reply.send(items);
  } catch (error: any) {
    app.log.error(error);
    return reply.status(500).send({ error: error.message });
  }
}

// /**
//  * Create a new item
//  */
// export async function addItemController(
//   app: FastifyInstance,
//   req: FastifyRequest<{
//     Body: ItemForm & { stock: number; isAvailable?: boolean };
//   }>,
//   reply: FastifyReply
// ) {
//   try {
//     const newItem = new ItemModel(req.body);
//     const savedItem = await newItem.save();
//     return reply.status(201).send(savedItem);
//   } catch (error: any) {
//     app.log.error(error);
//     return reply.status(500).send({ error: error.message });
//   }
// }

// /**
//  * Update an existing item by ID
//  */
// export async function updateItemController(
//   app: FastifyInstance,
//   req: FastifyRequest<{ Params: { id: string }; Body: Partial<StockItem> }>,
//   reply: FastifyReply
// ) {
//   try {
//     const { id } = req.params;
//     const updatedItem = await ItemModel.findByIdAndUpdate(id, req.body, {
//       new: true,
//       runValidators: true,
//     }).lean();

//     if (!updatedItem) {
//       return reply.status(404).send({ error: "Item not found" });
//     }

//     return reply.send(updatedItem);
//   } catch (error: any) {
//     app.log.error(error);
//     return reply.status(500).send({ error: error.message });
//   }
// }

// /**
//  * Delete an item by ID
//  */
// export async function deleteItemController(
//   app: FastifyInstance,
//   req: FastifyRequest<{ Params: { id: string } }>,
//   reply: FastifyReply
// ) {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return reply.status(400).send({ error: "ID is required for deletion" });
//     }

//     const deletedItem = await ItemModel.findByIdAndDelete(id).lean();

//     if (!deletedItem) {
//       return reply.status(404).send({ error: "Item not found" });
//     }

//     return reply.send({
//       message: `Item (${deletedItem.name}) deleted successfully`,
//       item: deletedItem,
//     });
//   } catch (error: any) {
//     app.log.error(error);
//     return reply.status(500).send({ error: error.message });
//   }
// }

export const ItemController = {
  // addItem: addItemController,
  getItems: getItemsController,
  // updateItem: updateItemController,
  // deleteItem: deleteItemController,
};

export default ItemController;
