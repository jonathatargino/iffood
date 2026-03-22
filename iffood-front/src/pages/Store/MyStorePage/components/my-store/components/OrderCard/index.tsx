import type { OrderRequestResponse } from "@/services/order-request";
import { OrderItemsList } from "./OrderItemsList";
import { OrderCardFooter } from "./OrderCardFooter";
import { OrderCardHeader } from "./OrderCardHeader";

interface OrderCardProps {
  order: OrderRequestResponse;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <div className="p-5">
      <OrderCardHeader order={order} />
      <OrderItemsList orderItems={order.items} />
      <OrderCardFooter totalPrice={order.total} />
    </div>
  );
}
