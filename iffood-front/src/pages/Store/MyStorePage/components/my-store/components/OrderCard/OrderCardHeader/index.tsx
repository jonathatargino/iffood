import type { OrderRequestResponse } from "@/services/order-request";
import { OrderCardActions } from "./components/OrderCardActions";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-400",
  CONCLUDED: "bg-green-400 ",
  REJECTED: "bg-red-400 ",
  CHANGED_AND_CONCLUDED: "bg-blue-100",
};

interface OrderCardHeaderProps {
  order: OrderRequestResponse;
}

export function OrderCardHeader({ order }: OrderCardHeaderProps) {
  const date = new Date(order.createdAt);
  const formattedDate = `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  const isPending = order.status === "PENDING";

  return (
    <div className="mb-3 flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-[#2e2e2e]">
          {order.buyerName}
          <div
            className={`h-2 w-2 rounded-full ${STATUS_COLORS[order.status]} ${isPending ? "animate-pulse" : ""}`}
          ></div>
        </div>
        <div className="text-xs text-gray-400">{formattedDate}</div>
      </div>

      <OrderCardActions order={order} />
    </div>
  );
}
