import React, { useEffect, useState } from "react";
import api from "@/api/api";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Plus } from "lucide-react";
import type { BaseItem } from "@shared/types/item.types";

interface ItemModalProps {
  item?: BaseItem | null;
  mode: "add" | "edit";
  onSubmit: (values: BaseItem) => void; // keep BaseItem here (includes _id)
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ItemModal({
  onSubmit,
  item = null,
  mode,
  open,
  onOpenChange,
}: ItemModalProps) {
  const isEditMode = mode === "edit";

  const [newItem, setNewItem] = useState<BaseItem>({
    name: "",
    price: 0,
    category: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Pre-fill form data when editing or reset when adding
  useEffect(() => {
    if (open) {
      if (isEditMode && item) {
        setNewItem({
          _id: item._id,
          name: item.name,
          price: item.price,
          category: item.category,
        });
      } else {
        setNewItem({ name: "", price: 0, category: "" });
      }
    }
  }, [open, isEditMode, item]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditMode) {
        const res = await api.patch(`/items/updateItem/${item?._id}`, newItem);
        onSubmit(res.data);
      } else {
        const res = await api.post("/items/addItem", newItem);
        onSubmit(res.data);
      }
      setNewItem({ name: "", price: 0, category: "" });
      onOpenChange(false); // Close modal on success
    } catch (err) {
      console.error("Error saving item:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {mode === "add" && (
        <DialogTrigger asChild>
          <Button
            variant="default"
            size="sm"
            className="lg:text-base text-xs bg-white/20 hover:bg-white/30"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details of this item and save changes."
              : "Enter the details of the new item. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter item name"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Item Price</Label>
              <Input
                id="price"
                type="number" step="0.01" min={0} 
                placeholder="Enter item price"
                value={newItem.price === 0 ? "" : newItem.price}
                onChange={(e) =>
                  setNewItem({ ...newItem, price: Number(e.target.value) })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newItem.category}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, category: value })
                }
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Dish">Dish</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              <Check className="mr-2 h-4 w-4" />
              {isEditMode
                ? isSubmitting
                  ? "Updating..."
                  : "Update Item"
                : isSubmitting
                ? "Saving..."
                : "Save Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
