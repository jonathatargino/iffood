import { SectionHeader } from "@/components/SectionHeader";
import { useOrdersByStore } from "@/pages/Store/MyStorePage/hooks/use-order-queries";
import { OrderCard } from "../../../OrderCard";
import { CenteredBouncingDots } from "@/components/CenteredBouncingDots";
import { getOrderPendingListSectionDescription } from "./utils";

interface OrderPendingListProps {
  storeId: string;
}

export function OrderPendingList({ storeId }: OrderPendingListProps) {
  const { data, isLoading } = useOrdersByStore(storeId, true);

  const orders = data || [];

  return (
    <div>
      <SectionHeader
        title="Pedidos pendentes"
        description={getOrderPendingListSectionDescription(orders.length)}
      />

      <div className="flex min-h-60 flex-col">
        {isLoading && <CenteredBouncingDots />}

        {!isLoading && (
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
        )}
      </div>
    </div>
  );
}
