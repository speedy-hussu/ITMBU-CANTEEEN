// shared/types/item.types.ts
export interface BaseItem {
  _id?: string;
  name: string;
  price: number; // keep numeric in the model
  category: string;
}

export interface StockItem extends BaseItem {
  stock: number;
}

export interface MenuItem extends BaseItem {
  isAvailable: boolean;
}
export interface CartItem extends BaseItem {
  quantity: number;
  total: number; // optional? => total?: number
}

export interface KdsItem extends BaseItem {
  quantity: number;
  checked?: boolean;
}

// for add-to-cart button you need price/name/category only:
export type CartInput = Pick<BaseItem, "name" | "price" | "category">;

// for the Item modal form you don’t have _id yet:
export type ItemForm = Omit<BaseItem, "_id">;
