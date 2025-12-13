import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/store/cartStore";
import { ShoppingCart } from "lucide-react";
import CartItem from "./cart-item";

interface CartProps {
  ws: WebSocket | null;
}

function Cart({ ws }: CartProps) {
  const cart = useCartStore((state) => state.cart);
  const emptyCart = useCartStore((state) => state.emptyCart);
  const totalPrice = useCartStore((state) => state.getCartTotal());

  const [token, setToken] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  // ✅ Place order via WebSocket
  const placeOrder = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      toast.error("Not connected to server");
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!token) {
      toast.error("Please enter a token");
      setError(true);
      return;
    }

    // ✅ Send order to Local Server
    const orderMessage = {
      type: "new_order",
      payload: {
        items: cart.map((item) => ({
          _id: item._id,
          name: item.name,
          price: Number(item.price),
          category: item.category,
          quantity: Number(item.quantity),
        })),
        token: token,
        total: totalPrice,
      },
      timestamp: Date.now(),
    };

    ws.send(JSON.stringify(orderMessage));

    console.log("📤 Order sent to Local Server:", orderMessage);
    toast.success("Order placed successfully!");
    emptyCart();
    setToken("");
  };
  return (
    <div className="lg:w-150 sm:w-120 bg-gray-100 p-5 flex flex-col justify-between">
      {/* Cart Items Section */}
      <div className="h-full py-2 w-full rounded-xl overflow-hidden flex flex-col gap-2">
        <Card className="py-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm md:text-base  flex items-center gap-2">
                <ShoppingCart className="md:h-5 md:w-5 w-4 h-4" />
                Current Order
              </CardTitle>
              <Input
                required
                type="text"
                placeholder="Token"
                className={`w-18 text-center ${
                  error ? " bg-red-50 border-3 border-red-500" : ""
                }`}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setError(false);
                }}
              />
            </div>
          </CardHeader>
        </Card>

        <ScrollArea className="h-200 overflow-auto">
          <div className="overflow-y-auto flex flex-col gap-1 ">
            {cart.length === 0 ? (
              <Card>
                <CardContent className="text-center text-gray-500">
                  Your cart is empty
                </CardContent>
              </Card>
            ) : (
              cart.map((item, index) => (
                <CartItem key={`${item.name}-${index}`} item={item} />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer Section */}
      <div className="space-y-2">
        <Card className="py-4">
          <CardContent>
            <div className="flex justify-between items-center text-lg font-semibold">
              <h2>Total</h2>
              <p className="text-[#667eea]">₹{totalPrice}</p>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full h-12 text-lg bg-gradient-to-tr from-[#667eea] to-[#764ba2] 
          hover:from-[#5a6fd8] hover:to-[#6a3f8f] text-white"
          onClick={placeOrder}
          disabled={!ws || cart.length === 0}
        >
          Place Order
        </Button>
      </div>
    </div>
  );
}

export default Cart;
