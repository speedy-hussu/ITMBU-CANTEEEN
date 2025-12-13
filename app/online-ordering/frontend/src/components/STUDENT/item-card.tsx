import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/store/cartStore";
import type { BaseItem } from "@shared/types/item.types";

interface ItemCardProps {
  item: BaseItem;
}

export default function ItemCard({ item }: ItemCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  const handleAddToCart = () => {
    addToCart(item);
    toast.success(`${item.name} added to cart 🛒`);
  };

  return (
    <Card
      onClick={handleAddToCart}
      className="cursor-pointer bg-white/90 hover:shadow-lg hover:scale-105 
    transition duration-300 ease-in-out p-3 flex items-start flex-col gap-2"
    >
      <CardContent className="p-0 w-full">
        <CardHeader className="p-0 font-bold text-gray-800">
          {item.name}
        </CardHeader>
        <CardTitle className="p-0 text-gradient-primary text-lg font-bold">
          ₹{item.price}
        </CardTitle>
      </CardContent>
    </Card>
  );
}
