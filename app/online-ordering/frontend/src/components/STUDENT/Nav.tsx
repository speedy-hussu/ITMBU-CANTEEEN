import { useState } from "react";
import { Button } from "../ui/button";
import { useCartStore } from "@/store/cartStore";
import { Clock, Home, ShoppingCart, User, Wifi, WifiOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../ui/badge";

export default function Nav({ kdsOnline }: { kdsOnline: boolean }) {
  const [currentView, setCurrentView] = useState<
    "menu" | "cart" | "history" | "profile"
  >("menu");
  const navigate = useNavigate();
  const { cart } = useCartStore();
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        <Button
          variant="ghost"
          size="icon"
          className={`w-15 flex flex-col items-center  h-full -space-y-2 relative ${
            currentView === "menu" ? "text-orange-500" : "text-gray-400"
          }`}
          onClick={() => {
            setCurrentView("menu");
            navigate("/");
          }}
        >
          <Home className="size-5" />
          <span className="text-xs mt-1">Home</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`w-15 flex flex-col items-center  h-full -space-y-2 relative ${
            currentView === "history" ? "text-orange-500" : "text-gray-400"
          }`}
          onClick={() => {
            setCurrentView("history");
            navigate("/orders");
          }}
        >
          <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-xs mt-1">Orders</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`w-15 flex flex-col items-center  h-full -space-y-2 relative ${
            currentView === "cart" ? "text-orange-500" : "text-gray-400"
          }`}
          onClick={() => {
            setCurrentView("cart");
            navigate("/cart");
          }}
        >
          <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
          {cart.length > 0 && (
            <Badge className="absolute top-1 right-1/4 bg-orange-500 text-white text-xs h-4 w-4 flex items-center justify-center p-0">
              {cart.length}
            </Badge>
          )}
          <span className="text-xs mt-1">Cart</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`w-15 flex flex-col items-center  h-full -space-y-2 relative ${
            currentView === "profile" ? "text-orange-500" : "text-gray-400"
          }`}
          onClick={() => {
            setCurrentView("profile");
            navigate("/profile");
          }}
        >
          <User className="w-5 h-5 sm:w-6 sm:h-6" />
          <span>Profile</span>
        </Button>
        <div
          className={`text-center text-xs ${
            kdsOnline ? "text-green-500" : "text-red-500"
          } p-2`}
        >
          <span className="flex items-center gap-1">
            KDS: {kdsOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          </span>
        </div>
      </div>
    </div>
  );
}
