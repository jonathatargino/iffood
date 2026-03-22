import type { EditOrderItem } from "@/pages/Store/MyStorePage/EditOrderRequestPage/types";
import { formatCentsToReaisWithSymbol } from "@/utils/currency";
import { QuantityController } from "../../../../QuantityController";

interface CurrentProductListItemProps {
  item: EditOrderItem;
  onRemove: (productOptionId: string) => void;
  onQuantityChange: (productOptionId: string, newQuantity: number) => void;
  productOptionMaxQuantityMap: Map<string, number>;
}

export function CurrentProductListItem({
  item,
  onRemove,
  onQuantityChange,
  productOptionMaxQuantityMap,
}: CurrentProductListItemProps) {
  function handleRemove() {
    onRemove(item.productOptionId);
  }

  function handleQuantityChange(newQuantity: number) {
    onQuantityChange(item.productOptionId, newQuantity);
  }

  const maxQuantity =
    productOptionMaxQuantityMap.get(item.productOptionId) ?? 99;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#2e2e2e]">
          {item.productName}{" "}
          <span className="font-normal text-gray-400">
            ({item.productOptionName})
          </span>
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          {item.quantity}x ·{" "}
          {formatCentsToReaisWithSymbol(item.productValue * item.quantity)}
        </p>
      </div>
      <QuantityController
        allowRemove
        quantity={item.quantity}
        updateQuantity={handleQuantityChange}
        onRemove={handleRemove}
        maxQuantity={maxQuantity}
      />
    </div>
  );
}
