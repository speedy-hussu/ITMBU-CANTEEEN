import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast, Toaster } from "sonner";

// Stores
import { useAuthStore } from "./store/authStore";
import { useOrderStore } from "./store/orderStore";

// Components & Pages
import Login from "./pages/Login";
import Home from "./pages/Home";
import Cashout from "./pages/Cashout";
import MyOrders from "./pages/MyOrders";
import UserProfile from "./pages/Profile";
import Nav from "./components/STUDENT/Nav";

// Types
import {
  parseWebSocketMessage,
  type ConnectionEstablishedPayload,
  type KDSStatusPayload,
  type OrderAckPayload,
  type OrderCompletedPayload,
  type OrderCancelledPayload,
} from "@shared/types/websocket.types";
import { getMe, logoutUser } from "./api/api";

const queryClient = new QueryClient();

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [, setConnectionError] = useState(false);
  const [kdsOnline, setKdsOnline] = useState(false);

  // Zustand State
  const { user } = useAuthStore();
  const { updateOrderStatus, updateOrderWithMongoId } = useOrderStore();
  const isAuthenticated = !!user;

  // 1. Authentication validation Refined
  useEffect(() => {
    const validateAuth = async () => {
      // Only validate if we THINK we are authenticated
      if (isAuthenticated) {
        try {
          const response = await getMe();
          // If the server returns a user, ensure the store is synced
          if (response.user) {
            console.log("✅ Session verified");
            // Optional: useAuthStore.getState().login(response.user);
          }
        } catch (error) {
          console.error("❌ Session expired, cleaning up...");

          // 1. Clear Zustand store first
          useAuthStore.getState().logout();

          // 2. Call backend logout to clear cookies
          await logoutUser();

          // 3. Instead of reload, let Navigate handles the redirect
          toast.error("Session expired. Please login again.");
        }
      }
    };

    validateAuth();
  }, [isAuthenticated]);
  // 1. WebSocket Lifecycle Management
  useEffect(() => {
    if (!isAuthenticated) {
      if (ws) {
        ws.close(1000, "Logout");
        setWs(null);
      }
      return;
    }

    if (ws) return; // Prevent duplicate connections

    setIsConnecting(true);

    const socket = new WebSocket(import.meta.env.VITE_WS_BASE_URL);
    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      setIsConnecting(false);
      setConnectionError(false);
    };

    socket.onmessage = (msg) => {
      const data = parseWebSocketMessage(msg.data);
      if (!data) return;

      switch (data.type) {
        case "connection_established":
          const connPayload = data.payload as ConnectionEstablishedPayload;
          setKdsOnline(connPayload?.kdsOnline || false);
          break;

        case "kds_status":
          const statusPayload = data.payload as KDSStatusPayload;
          setKdsOnline(statusPayload.online);
          statusPayload.online
            ? toast.success("Kitchen is online!")
            : toast.warning("Kitchen went offline");
          break;

        case "order_ack":
          const ack = data.payload as OrderAckPayload;
          if (ack.success && ack.localOrderId && ack.cloudOrderId) {
            updateOrderWithMongoId(
              ack.localOrderId,
              ack.cloudOrderId,
              "PENDING"
            );
            toast.success(`Order confirmed! ID: ${ack.cloudOrderId}`);
          } else if (!ack.success) {
            toast.error(ack.error || "Order confirmation failed");
          }
          break;

        case "order_completed":
          const comp = data.payload as OrderCompletedPayload;
          if (comp && comp.token) {
            updateOrderStatus(comp.token, "COMPLETED");
            toast.success(`🎉 Order #${comp.token} is ready!`, {
              duration: 5000,
            });
          } else {
            console.warn("Invalid order_completed payload:", data.payload);
          }
          break;

        case "order_cancelled":
          const cancl = data.payload as OrderCancelledPayload;
          updateOrderStatus(cancl.token, "CANCELLED");
          toast.info(`Order #${cancl.token} was cancelled`);
          break;
      }
    };

    socket.onerror = () => {
      setIsConnecting(false);
      setConnectionError(true);
    };

    socket.onclose = () => {
      setWs(null);
      setIsConnecting(false);
    };

    setWs(socket);

    return () => {
      // Keep socket alive during navigation, only close on logout/unmount
    };
  }, [isAuthenticated, ws, updateOrderStatus, updateOrderWithMongoId]);

  // Loading Screen for WebSocket initialization
  if (isAuthenticated && isConnecting) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">
            Connecting to Kitchen...
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-[calc(100dvh-260px)] w-full max-w-3xl mx-auto px-4 pb-20">
          <Routes>
            {/* Public Route */}
            <Route
              path="/login"
              element={
                !isAuthenticated ? <Login /> : <Navigate to="/" replace />
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                isAuthenticated ? <Home /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/cart"
              element={
                isAuthenticated ? (
                  <Cashout ws={ws} kdsOnline={kdsOnline} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/orders"
              element={
                isAuthenticated ? (
                  <MyOrders />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/profile"
              element={
                isAuthenticated ? (
                  <UserProfile />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Toaster position="top-center" richColors />
        {isAuthenticated && <Nav kdsOnline={kdsOnline} />}
      </Router>
    </QueryClientProvider>
  );
}

export default App;
