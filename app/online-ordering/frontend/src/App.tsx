// App.tsx - Using typed WebSocket messages

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
  type ConnectionEstablishedPayload,
  type KDSStatusPayload,
  type OrderRejectedPayload,
  type StudentOrderReceivedPayload,
  type OrderAckPayload,
  type OrderCompletedPayload,
} from "@shared/types/websocket.types";
import { useOrderStore } from "./store/orderStore";

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [kdsOnline, setKdsOnline] = useState(false); // ✅ Track KDS status
  const { updateOrderStatus } = useOrderStore();

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
      setKdsOnline(false);
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
        // ✅ Handle initial connection with KDS status
        case "connection_established": {
          const payload = data.payload as ConnectionEstablishedPayload;
          const isKdsOnline = payload?.kdsOnline || false;
          setKdsOnline(isKdsOnline);
          console.log("🔌 Connected to cloud. KDS status:", isKdsOnline);

          if (!isKdsOnline) {
            toast.warning("Connected, but kitchen is offline");
          }
          break;
        }

        // ✅ Handle real-time KDS status updates
        case "kds_status": {
          const payload = data.payload as KDSStatusPayload;
          const isOnline = payload?.online || false;
          setKdsOnline(isOnline);

          if (isOnline) {
            toast.success(" Kitchen is now online!");
          } else {
            toast.warning(" Kitchen went offline");
          }
          break;
        }

        // ✅ Handle order rejection when KDS is offline
        case "order_rejected": {
          const payload = data.payload as OrderRejectedPayload;
          toast.error("❌ Order rejected - Kitchen is offline", {
            description:
              payload.message || "Please try again when kitchen is available",
            duration: 5000,
          });
          break;
        }

        // ✅ Order received by cloud
        case "student_order_received": {
          const payload = data.payload as StudentOrderReceivedPayload;
          console.log("Order received by cloud:", payload);

          if (payload.success) {
            toast.success(`Order ${payload.cloudOrderId} received`);
          }
          break;
        }

        // ✅ Order acknowledged by kitchen
        case "order_ack": {
          const payload = data.payload as OrderAckPayload;

          if (payload.success && payload.localOrderId) {
            toast.success(
              `✅ Order confirmed! Kitchen ID: ${payload.localOrderId}`
            );
            console.log(
              `Order ${payload.cloudOrderId} → Kitchen ${payload.localOrderId}`
            );
          } else {
            toast.error(`❌ Order failed: ${payload.error || "Unknown error"}`);
          }
          break;
        }

        case "new_order": {
          const payload = data.payload as NewOrderPayload;
          if (!payload) {
            console.error("Empty new_order payload received");
            toast.error("Error: Empty order data received");
            break;
          }

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

          if (!payload?.token) {
            console.error("Invalid order_completed payload:", payload);
            break;
          }
          updateOrderStatus(payload.token, "COMPLETED");
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
          updateOrderStatus(payload.token, "CANCELLED");
          break;
        }

        default:
          console.log("Unknown message type:", data.type);
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, updateOrderStatus]);

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
        <div className="min-h-[calc(100dvh-260px)] w-md md:w-lg lg:w-3xl">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            {/* ✅ Pass kdsOnline to Cashout */}
            <Route
              path="/cart"
              element={<Cashout ws={ws} kdsOnline={kdsOnline} />}
            />
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
