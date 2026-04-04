import type { OrderRequestItemResponse } from "@/services/order-request";
import { formatCentsToReaisWithSymbol } from "@/utils/currency";
import { EllipsisIcon } from "lucide-react";

interface OrderItemsListProps {
  orderItems: OrderRequestItemResponse[];
}

export function OrderItemsList({ orderItems }: OrderItemsListProps) {
  const shouldTruncateOrderItemsList = orderItems.length > 2;

  return (
    <div className="mb-3">
      <div className="space-y-2">
        {orderItems.slice(0, 2).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-sm"
          >
            <div className="text-[#2e2e2e]">
              {item.quantity}x {item.productName}{" "}
              <span className="font-normal text-gray-500">
                ({item.productOptionName})
              </span>
            </div>
            <div className="text-gray-500">
              {formatCentsToReaisWithSymbol(item.productValue * item.quantity)}
            </div>
          </div>
        ))}
      </div>
      {shouldTruncateOrderItemsList && (
        <EllipsisIcon size={16} className="text-gray-400" />
      )}
    </div>
  );
}
