import { OrderPendingList } from "./components/OrderLists/components/OrderPendingList";

type OrdersTabProps = {
  storeId: string;
};

export function OrdersTab({ storeId }: OrdersTabProps) {
  return (
    <div>
      <OrderPendingList storeId={storeId} />
    </div>
  );
}
