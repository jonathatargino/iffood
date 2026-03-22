import { SectionHeader } from "@/components/SectionHeader";
import { useOrdersByStore } from "@/pages/Store/MyStorePage/hooks/use-order-queries";
import { OrderCard } from "../../../OrderCard";

interface OrderPendingListProps {
  storeId: string;
}

export function OrderPendingList({ storeId }: OrderPendingListProps) {
  const { data: orders } = useOrdersByStore(storeId, true);

  const hasPendingOrders = orders && orders.length > 0;

  if (!orders) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-35 animate-pulse rounded-3xl bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Pedidos pendentes"
        description={
          hasPendingOrders
            ? "Responda-os para subtrair automaticamente os produtos"
            : "Nenhum pedido pendente"
        }
      />
      <div className="flex flex-col gap-3">
        {orders.map((order, index) => (
          <>
            {index > 0 && (
              <hr className="mx-auto w-[90%] border-t border-gray-100" />
            )}
            <OrderCard key={order.id} order={order} />
          </>
        ))}
      </div>
    </div>
  );
}
