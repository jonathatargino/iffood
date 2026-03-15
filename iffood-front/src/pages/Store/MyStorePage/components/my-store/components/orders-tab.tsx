import { useOrdersByStore } from "../../../hooks/use-order-queries";
import { OrderCard } from "./OrderCard";
import { ClipboardList } from "lucide-react";

type OrdersTabProps = {
  storeId: string;
};

export function OrdersTab({ storeId }: OrdersTabProps) {
  const { data: orders, isLoading } = useOrdersByStore(storeId, true);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-35 animate-pulse rounded-3xl bg-gray-200" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-gray-100">
          <ClipboardList className="h-10 w-10 text-gray-400" />
        </div>
        <p className="mb-1 text-gray-500">Nenhum pedido</p>
        <p className="text-sm text-gray-400">
          Os pedidos dos clientes aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
