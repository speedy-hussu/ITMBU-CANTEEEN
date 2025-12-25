import { toast } from "sonner";
import { useOrdersStore } from "@/store/orderStore";
import type { Order } from "@shared/types/order.types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CardItem from "./card-item";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";

interface Props {
  order: Order;
  ws: WebSocket | null;
}

export default function OrderCard({ order, ws }: Props) {
  const { updateOrderStatus, orders, toggleItemChecked, removeOrder } =
    useOrdersStore();

  // ✅ Single lookup instead of double
  const currentOrder = orders.find((o) => o._id === order._id);

  if (!currentOrder) return null;

  // ✅ Calculate locally to avoid extra store call
  const allChecked =
    currentOrder.items.length > 0 &&
    currentOrder.items.every((item) => item.checked === true);
  const handleCheck = (index: number) => {
    toggleItemChecked(order._id, index);
  };

  const handleDone = async () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      toast.error("Not connected to server");
      return;
    }

    try {
      // ✅ Update local state
      updateOrderStatus(order._id, "COMPLETED");

      // ✅ Send WebSocket message
      ws.send(
        JSON.stringify({
          type: "order_completed",
          payload: {
            orderId: order._id,
          },
          timestamp: Date.now(),
        })
      );

      console.log("📤 Sent order_completed for orderId:", order._id);
      toast.success(`Order #${order.token} is ready!`);
    } catch (error) {
      console.error("Error completing order:", error);
      toast.error(`Failed to complete order #${order.token}`);
    }
  };

  const handleCancel = async () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      toast.error("Not connected to server");
      return;
    }
    try {
      // ✅ Update local state
      removeOrder(order._id);

      // ✅ Send WebSocket message
      ws.send(
        JSON.stringify({
          type: "order_cancelled",
          payload: {
            orderId: order._id,
            token: order.token,
          },
          timestamp: Date.now(),
        })
      );

      console.log("📤 Sent order_cancelled for orderId:", order._id);
      toast.success(`Order #${order.token} is cancelled!`);
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error(`Failed to cancel order #${order.token}`);
    }
  };
  const isCompleted = currentOrder.status === "COMPLETED";
  const canComplete = !isCompleted && allChecked;

  return (
    <Card
      className="text-[#333] relative h-65 flex flex-col gap-0 justify-between bg-white p-3 
    rounded-xl  transition duration-300 ease-in-out shadow-sm border"
    >
      <div>
        <h1 className="text-center text-2xl font-bold">#{order.token}</h1>

        {order.status === "COMPLETED" ? null : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <X className="absolute text-xl top-2 right-2 text-red-500 cursor-pointer hover:text-red-600 transition-colors" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Order</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove order #{order.token}? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <div
          className="max-h-40 overflow-y-auto 
          [&::-webkit-scrollbar]:w-1 
          [&::-webkit-scrollbar-thumb]:bg-gray-300 
          [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          <div className="rounded-lg overflow-hidden mr-1">
            {order.items.map((item, index) => (
              <CardItem
                key={index}
                name={item.name}
                qty={item.quantity}
                checked={
                  order.status !== "COMPLETED" ? item.checked ?? false : false
                }
                onCheck={
                  order.status !== "COMPLETED"
                    ? () => handleCheck(index)
                    : () => {}
                }
                disabled={order.status === "COMPLETED"}
              />
            ))}
          </div>
        </div>
      </div>

      <Button
        className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] 
            hover:from-[#5a6fd8] hover:to-[#6a3f8f] text-white font-semibold"
        disabled={!canComplete}
        onClick={handleDone}
      >
        {isCompleted ? "✓ Completed" : "Mark as Done"}
      </Button>
    </Card>
  );
}
