import type { OrderRequestResponse } from "@/services/order-request";
import { OrderItemsList } from "./OrderItemsList";
import { OrderCardFooter } from "./OrderCardFooter";
import { OrderCardHeader } from "./OrderCardHeader";

interface OrderCardProps {
  order: OrderRequestResponse;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <OrderCardHeader order={order} />
      <OrderItemsList orderItems={order.items} />
      <OrderCardFooter totalPrice={order.total} />
    </div>
  );
}
