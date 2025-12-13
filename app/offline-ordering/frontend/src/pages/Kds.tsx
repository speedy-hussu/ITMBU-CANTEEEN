import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import OrderCard from "@/components/kds/order-card";
import { useOrdersStore } from "@/store/orderStore";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  parseWebSocketMessage,
  type NewOrderPayload,
  type OrderCompletedPayload,
  type SyncOrdersPayload,
} from "../../../../shared/types/index";

export default function Orders() {
  const { orders, addOrder, updateOrder, removeOrder, setOrders } =
    useOrdersStore();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<"Pending" | "Completed">("Pending");
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  // WebSocket connection setup
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:4000/ws/local?type=kds");

    socket.onopen = () => {
      console.log("✅ KDS WebSocket connected");
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

  // WebSocket message listener
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (msg: MessageEvent) => {
      console.log("KDS received:", msg.data);

      const data = parseWebSocketMessage(msg.data);
      if (!data) return;

      switch (data.type) {
        case "new_order": {
          const payload = data.payload as NewOrderPayload;
          const order = payload.order;

          // ✅ Order already has proper structure with order.id
          addOrder(order);
          console.log("📦 New order added:", order.token, "ID:", order._id);
          break;
        }

        case "sync_orders": {
          const payload = data.payload as SyncOrdersPayload;
          setOrders(payload.orders);
          console.log(`🔄 Synced ${payload.orders.length} orders`);
          break;
        }

        case "order_completed": {
          const payload = data.payload as OrderCompletedPayload;
          updateOrder(payload.orderId, { status: "COMPLETED" });
          console.log("✅ Order completed:", payload.order.token);
          break;
        }

        case "order_cancelled": {
          const payload = data.payload as { orderId: string };
          removeOrder(payload.orderId);
          console.log("🗑️ Order cancelled:", payload.orderId);
          break;
        }

        default:
          console.warn("Unknown message type", data.type);
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, addOrder, updateOrder, removeOrder, setOrders]);

  if (isConnecting) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white grid place-items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white grid place-items-center">
        <div className="text-center">
          <p className="text-xl text-red-200 mb-4">
            Failed to connect to server
          </p>
          <p className="text-sm">Please check if the server is running</p>
        </div>
      </div>
    );
  }

  // Orders grouping by status
  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  // Active tab ke hisaab se dikhane wale orders
  const visibleOrders = (
    status === "Pending" ? pendingOrders : completedOrders
  ).filter((order) =>
    searchTerm ? order.token.toString().includes(searchTerm) : true
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white">
      <div className="flex gap-10 p-5">
        <h1 className="text-3xl font-bold mb-6">ITMBU KITCHEN</h1>
        <div className="flex flex-wrap items-center gap-5 mb-4">
          <Tabs
            value={status}
            onValueChange={(value) =>
              setStatus(value as "Pending" | "Completed")
            }
            className="w-auto"
          >
            <TabsList className="bg-white/20 border-white/30">
              <TabsTrigger
                value="Pending"
                className="data-[state=active]:bg-white data-[state=active]:text-[#667eea] relative"
              >
                Pending
                {pendingOrders.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-white text-[#667eea] hover:bg-white"
                  >
                    {pendingOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="Completed"
                className="data-[state=active]:bg-white data-[state=active]:text-[#667eea] relative"
              >
                Completed
                {completedOrders.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-white text-[#667eea] hover:bg-white"
                  >
                    {completedOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative flex-1 min-w-[250px] max-w-md">
            <Search className="absolute z-10 top-1/2 left-3 transform -translate-y-1/2 text-white/70" />
            <Input
              type="text"
              placeholder="Search Order"
              value={searchTerm}
              className="pl-10 pr-10 bg-white/20 border-2 border-white/30 text-white placeholder:text-white/70 focus-visible:ring-white focus-visible:border-white"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <X
                className="cursor-pointer absolute z-10 top-1/2 right-3 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                onClick={() => setSearchTerm("")}
              />
            )}
          </div>
        </div>
      </div>

      {status === "Pending" && pendingOrders.length === 0 ? (
        <div className="h-[calc(100vh-180px)] grid place-items-center">
          <div className="flex flex-col justify-center items-center text-center">
            <h1 className="text-4xl font-bold">No Pending Orders</h1>
          </div>
        </div>
      ) : status === "Completed" && completedOrders.length === 0 ? (
        <div className="h-[calc(100vh-180px)] grid place-items-center">
          <div className="flex flex-col justify-center items-center text-center">
            <h1 className="text-4xl font-bold">No Completed Orders</h1>
          </div>
        </div>
      ) : (
        <div
          className="h-[calc(100vh-100px)] overflow-y-auto
          grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))]
          gap-6 px-5 pb-5
          [&::-webkit-scrollbar]:w-2 
          [&::-webkit-scrollbar-thumb]:bg-white/40
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:hover:bg-white/60"
        >
          {visibleOrders.map((order) => (
            <OrderCard key={order._id} ws={ws} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
