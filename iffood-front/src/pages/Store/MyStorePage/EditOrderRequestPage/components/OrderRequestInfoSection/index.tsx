import { SectionHeader } from "@/components/SectionHeader";
import { OrderCardHeader } from "../../../components/my-store/components/OrderCard/OrderCardHeader";
import type { OrderRequestResponse } from "@/services/order-request";
import { CurrentProductList } from "./components/CurrentProductList";
import type { EditOrderItem } from "../../types";

interface OrderRequestInfoSectionProps {
  order: OrderRequestResponse;
  items: EditOrderItem[];
  total: number;
  onQuantityChange: (productOptionId: string, newQuantity: number) => void;
  onRemoveItem: (productOptionId: string) => void;
  productOptionMaxQuantityMap: Map<string, number>;
  onClearItems: () => void;
}

export function OrderRequestInfoSection({
  items,
  total,
  order,
  onQuantityChange,
  onRemoveItem,
  productOptionMaxQuantityMap,
  onClearItems,
}: OrderRequestInfoSectionProps) {
  return (
    <div>
      <SectionHeader title="Detalhes do pedido" />
      <div className="flex flex-col gap-3 p-6">
        <OrderCardHeader order={order} showActions={false} />
        <CurrentProductList
          items={items}
          onQuantityChange={onQuantityChange}
          onRemoveItem={onRemoveItem}
          total={total}
          productOptionMaxQuantityMap={productOptionMaxQuantityMap}
          onClearItems={onClearItems}
        />
      </div>
    </div>
  );
}
