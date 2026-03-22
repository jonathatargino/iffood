import { formatCentsToReaisWithSymbol } from "@/utils/currency";
import { CurrentProductListItem } from "./components/CurrentProductListItem";
import type { EditOrderItem } from "../../../../types";

interface CurrentProductListProps {
  items: EditOrderItem[];
  onRemoveItem: (productOptionId: string) => void;
  onQuantityChange: (productOptionId: string, newQuantity: number) => void;
  total: number;
  productOptionMaxQuantityMap: Map<string, number>;
  onClearItems: () => void;
}

export function CurrentProductList({
  onRemoveItem,
  onQuantityChange,
  total,
  items,
  productOptionMaxQuantityMap,
  onClearItems,
}: CurrentProductListProps) {
  return (
    <div className="space-y-6 px-6 py-6">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#2e2e2e]">
            Itens do pedido
          </h2>
          <button
            className="ml-auto p-1 text-sm font-bold text-[#FF7622]"
            onClick={onClearItems}
          >
            Limpar
          </button>
        </div>

        {items.length === 0 ? (
          <p className="rounded-2xl border border-gray-100 bg-white py-6 text-center text-sm text-gray-400">
            Nenhum item. Adicione pelo menos um para continuar.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <CurrentProductListItem
                key={item.productOptionId}
                item={item}
                onRemove={onRemoveItem}
                onQuantityChange={onQuantityChange}
                productOptionMaxQuantityMap={productOptionMaxQuantityMap}
              />
            ))}
          </div>
        )}
      </section>

      {items.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
          <span className="text-sm text-gray-500">Total</span>
          <span className="text-sm font-semibold text-[#FF7622]">
            {formatCentsToReaisWithSymbol(total)}
          </span>
        </div>
      )}
    </div>
  );
}
