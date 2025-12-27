import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useOrderStore } from "@/store/orderStore";

export default function MyOrders() {
  const { orders } = useOrderStore();
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500";
      case "PENDING":
        return "bg-yellow-400";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };
  return (
    <div className="pb-20 min-h-[calc(100dvh-65px)] bg-gradient-primary">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm p-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Order History
        </h1>
      </div>
      {orders ? (
        <div className="p-4  grid md:grid-cols-2 gap-3 sm:gap-4">
          {orders.map((order) => (
            <Card key={order._id} className="p-0">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                      {order.token}
                    </h3>
                  </div>
                  <Badge
                    className={`${getStatusColor(
                      order.status
                    )} text-white text-xs`}
                  >
                    {order.status}
                  </Badge>
                </div>
                <div className="space-y-1 mb-3">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-xs sm:text-sm text-gray-600"
                    >
                      <span>{item.name}</span>
                      <span>{item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="text-orange-500 font-bold text-base sm:text-lg">
                    ₹{order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div>No Orders</div>
      )}
    </div>
  );
}
