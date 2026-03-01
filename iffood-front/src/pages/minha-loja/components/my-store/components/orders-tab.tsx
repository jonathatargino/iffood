import { useOrdersByStore } from "../../../hooks/use-order-queries";
import {
  useConcludeOrder,
  useRejectOrder,
} from "../../../hooks/use-order-mutations";
import { OrderCard } from "./order-card";
import { ClipboardList } from "lucide-react";

type OrdersTabProps = {
  storeId: string;
};

export function OrdersTab({ storeId }: OrdersTabProps) {
  const { data: orders, isLoading } = useOrdersByStore(storeId, true);
  const concludeMutation = useConcludeOrder(storeId);
  const rejectMutation = useRejectOrder(storeId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-3xl h-[140px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="size-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-500 mb-1">Nenhum pedido</p>
        <p className="text-sm text-gray-400">
          Os pedidos dos clientes aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onConclude={(id) => concludeMutation.mutate(id)}
          onReject={(id) => rejectMutation.mutate(id)}
          isConcluding={concludeMutation.isPending}
          isRejecting={rejectMutation.isPending}
        />
      ))}
    </div>
  );
}
