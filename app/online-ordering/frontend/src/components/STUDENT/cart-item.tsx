import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus } from "lucide-react";

interface CartItemProps {
  item: {
    name: string;
    price: number;
    quantity: number;
    category: string;
  };
}

function CartItem({ item }: CartItemProps) {
  const { addToCart, removeFromCart } = useCartStore();

  return (
    <Card className="w-full p-0 py-2 rounded-sm ">
      <CardContent className=" flex justify-between items-center gap-4">
        <div className="flex-1">
          <h2 className="font-bold lg:text-lg text:xs  text-gray-800">
            {item.name}
          </h2>
          <p className="text-gray-600 md:text-sm text-xs">₹{item.price} each</p>
        </div>
        <div className="flex items-center  gap-1 ">
          <Button
            size="icon"
            variant="default"
            className="md:h-6 md:w-6 h-4 w-4 rounded-full bg-[#667eea] hover:bg-[#5a6fd8] text-white"
            onClick={() =>
              removeFromCart({
                name: item.name,
                price: item.price,
                category: item.category,
              })
            }
          >
            <Minus className="size-3" />
          </Button>
          <span className="font-semibold lg:text-lg text-base min-w-[2ch] text-center">
            {item.quantity}
          </span>
          <Button
            size="icon"
            variant="default"
            className="md:h-6 md:w-6 h-4 w-4  rounded-full bg-[#667eea] hover:bg-[#5a6fd8] text-white"
            onClick={() =>
              addToCart({
                name: item.name,
                price: item.price,
                category: item.category,
              })
            }
          >
            <Plus className="size-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default CartItem;
