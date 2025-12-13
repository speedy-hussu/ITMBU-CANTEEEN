import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const orderHistory = [
  {
    id: "#CB20230901",
    date: "Sep 1, 2023",
    items: ["Chicken Biryani", "Fresh Mango Juice"],
    total: 25.5,
    status: "Completed",
  },
  {
    id: "#CB20230828",
    date: "Aug 28, 2023",
    items: ["Veggie Wrap", "Orange Smoothie"],
    total: 18.0,
    status: "Delivered",
  },
  {
    id: "#CB20230825",
    date: "Aug 25, 2023",
    items: ["Large Pizza", "Garlic Bread", "Cola"],
    total: 32.75,
    status: "Pending",
  },
  {
    id: "#CB20230820",
    date: "Aug 20, 2023",
    items: ["Salad Bowl"],
    total: 12.0,
    status: "Cancelled",
  },
];
export default function MyOrders() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-orange-500";
      case "Delivered":
        return "bg-green-500";
      case "Pending":
        return "bg-gray-400";
      case "Cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };
  return (
    <div className="pb-20 min-h-[calc(100dvh-260px)] bg-gradient-primary">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm p-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Order History
        </h1>
      </div>

      <div className="p-4 space-y-3 grid md:grid-cols-2 gap-3 sm:gap-4">
        {orderHistory.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                    Order {order.id}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    {order.date}
                  </p>
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
                    <span>{item}</span>
                    <span>x1</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="text-orange-500 font-bold text-base sm:text-lg">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
