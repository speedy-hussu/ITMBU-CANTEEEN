import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Cashout from "./pages/Cashout";
import MyOrders from "./pages/MyOrders";
import Nav from "./components/STUDENT/Nav";
import { Toaster } from "sonner";
import UserProfile from "./pages/Profile";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  parseWebSocketMessage,
  type NewOrderPayload,
  type OrderCancelledPayload,
} from "@shared/types/websocket.types";

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const socket = new WebSocket(
      "wss://itmbu-canteeen.onrender.com/ws/student"
    );

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
          const payload = data.payload;

          if (!payload?.token) {
            console.error("Invalid order_completed payload:", payload);
            break;
          }

          toast.success(`🎉 Order #${payload.token} is ready for pickup!`, {
            duration: 5000,
          });

          console.log(`🔔 Order ready: ${payload.token}`);
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
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-[calc(100dvh-260px)] w-md md:w-lg lg:w-3xl  ">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cart" element={<Cashout ws={ws} />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Toaster position="top-center" />
        <Nav />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
