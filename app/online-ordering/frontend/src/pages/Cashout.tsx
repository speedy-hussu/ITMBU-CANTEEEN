import { Button } from "@/components/ui/button";
import { ShoppingCart, X } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import CartItem from "@/components/STUDENT/cart-item";
import { useOrderStore } from "@/store/orderStore";

interface CartProps {
  ws: WebSocket | null;
}

export default function Cashout({ ws }: CartProps) {
  const { cart, getCartTotal } = useCartStore();
  const { addOrder } = useOrderStore();
  const cartTotal = getCartTotal();

  const placeOrder = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      toast.error("Not connected to server");
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const orderToken = `TKN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // ✅ 1. Create ORDER (reusable)
    const order = {
      _id: orderToken,
      token: orderToken,
      items: cart.map((item) => ({
        _id: item._id,
        name: item.name,
        price: Number(item.price),
        category: item.category,
        quantity: Number(item.quantity),
      })),
      totalAmount: cartTotal,
      status: "PENDING" as const,
      source: "STUDENT" as const,
      createdAt: new Date().toISOString(),
    };

    // ✅ 2. Store locally (Zustand)
    addOrder(order);

    // ✅ 3. Wrap order for WebSocket
    const orderMessage = {
      type: "student_order",
      payload: { order },
      timestamp: Date.now(),
    };

    try {
      ws.send(JSON.stringify(orderMessage));
      toast.success("Order placed successfully!");
    } catch (error) {
      toast.error("Failed to place order");
    }
  };

  return (
    <div className="pb-20 min-h-[calc(100dvh-65px)] bg-gradient-primary">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon">
            <X className="w-5 h-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Cart & Payment
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Your Order */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Your Order</h2>
          <div className="space-y-3">
            {cart.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">Your cart is empty</p>
                </CardContent>
              </Card>
            ) : (
              cart.map((cartItem) => (
                <CartItem item={cartItem} key={cartItem._id} />
              ))
            )}
          </div>
        </div>

        {/* Total */}
        {cart.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-gradient-primary">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proceed Button */}
        {cart.length > 0 && (
          <Button
            className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white"
            onClick={placeOrder}
          >
            Proceed to Payment
          </Button>
        )}
      </div>
    </div>
  );
}
