import Cart from "@/components/pos/cart";
import Menu from "@/components/pos/menu";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  parseWebSocketMessage,
  type NewOrderPayload,
  type OrderCancelledPayload,
  type OrderCompletedPayload,
} from "../../../../shared/types/index";

export default function Pos() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:4000/ws/local?type=pos");

    socket.onopen = () => {
      console.log("✅ POS WebSocket connected");
      setIsConnecting(false);
      setConnectionError(false);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnecting(false);
      setConnectionError(true);
    };

    socket.onclose = (event) => {
      console.log(
        `WebSocket disconnected: ${event.code} ${event.reason || ""}`
      );
      setIsConnecting(false);
      if (event.code !== 1000) {
        setConnectionError(true);
      }
    };

    setWs(socket);

    return () => {
      socket.close(1000, "Component unmounting");
    };
  }, []);

  // Listen for incoming messages
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (msg: MessageEvent) => {
      const data = parseWebSocketMessage(msg.data);
      if (!data) return;

      console.log("POS received:", data.type);

      console.log(
        "Processing message type:",
        data.type,
        "with payload:",
        data.payload
      );

      switch (data.type) {
        case "new_order": {
          const payload = data.payload as NewOrderPayload;
          if (!payload) {
            console.error("Empty new_order payload received");
            toast.error("Error: Empty order data received");
            break;
          }

          // Extract token from either payload.token or payload.order?.token
          const orderToken = payload.order.token || payload.order?.token;
          const orderId = payload.order._id;

          if (!orderToken) {
            console.error("Missing order token in payload:", payload);
            toast.error("Error: Missing order token");
            break;
          }

          toast.success(`Order #${orderToken} sent to kitchen!`);
          console.log("✅ Order created with ID:", orderId);
          break;
        }

        case "order_completed": {
          const payload = data.payload as OrderCompletedPayload;
          if (!payload?.order) {
            console.error("Invalid order_completed payload:", payload);
            break;
          }
          const { token } = payload.order;

          toast.success(`🎉 Order #${token} is ready for pickup!`, {
            duration: 5000,
          });

          // // Optional: Play notification sound
          // try {
          //   const audio = new Audio("/notification.mp3");
          //   audio.play().catch((e) => console.log("Audio failed:", e));
          // } catch (err) {
          //   console.log("Sound notification failed:", err);
          // }

          console.log(`🔔 Order #${token} is ready (ID: ${payload.orderId})`);
          break;
        }

        case "order_cancelled": {
          const payload = data.payload as OrderCancelledPayload;
          const token = payload.token;
          console.log("token", token);
          toast.info(`Order #${token} is cancelled`);
          console.log("order_cancelled:", payload);

          break;
        }

        default:
          console.log("Unknown message type:", data.type);
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws]);

  if (isConnecting) {
    return (
      <div className="h-dvh w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-lg">Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="h-dvh w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">
            Failed to connect to server
          </p>
          <p className="text-sm text-gray-600">
            Please check if the server is running
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full flex">
      <Menu />
      <Cart ws={ws} />
    </div>
  );
}
