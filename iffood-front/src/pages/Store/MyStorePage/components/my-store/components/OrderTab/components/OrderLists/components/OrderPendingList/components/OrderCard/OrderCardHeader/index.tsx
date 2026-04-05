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
  showActions?: boolean;
}

export function OrderCardHeader({
  order,
  showActions = true,
}: OrderCardHeaderProps) {
  const date = new Date(order.createdAt);
  const formattedDate = `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  const isPending = order.status === "PENDING";

  return (
    <div className="mb-2 flex items-start justify-between">
      <div className="flex gap-3">
        <div>
          <img src={order.buyerPhotoUrl} className="h-8 w-8 rounded-full" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-[#2e2e2e]">
            {order.buyerName}
            <div
              className={`h-2 w-2 rounded-full ${STATUS_COLORS[order.status]} ${isPending ? "animate-pulse" : ""}`}
            ></div>
          </div>
          <div className="flex gap-2 text-xs text-gray-400">
            <span>{order.buyerWhatsapp}</span>
            {formattedDate}
          </div>
        </div>
      </div>

      {showActions && <OrderCardActions order={order} />}
    </div>
  );
}
