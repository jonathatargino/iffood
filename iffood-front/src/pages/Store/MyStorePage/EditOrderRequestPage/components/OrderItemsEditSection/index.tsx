import { formatCentsToReaisWithSymbol } from "@/utils/currency";
import { Plus } from "lucide-react";
import type { EditOrderItem } from "../../types";
import { useState } from "react";
import type { Product, ProductOption } from "@/services/product";
import { QuantityController } from "../QuantityController";

interface OrderEditSectionProps {
  products: Product[];
  isLoadingProducts: boolean;
  onAddItem: (item: EditOrderItem) => void;
}

export function OrderItemsEditSection({
  products,
  isLoadingProducts,
  onAddItem,
}: OrderEditSectionProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(
    null,
  );
  const [currentQuantity, setCurrentQuantity] = useState(1);

  function handleAddItem() {
    if (!selectedProduct || !selectedOption) {
      return;
    }

    onAddItem({
      productName: selectedProduct.name,
      productOptionName: selectedOption.name,
      productOptionId: selectedOption.id,
      quantity: currentQuantity,
      productValue: selectedProduct.value,
    });

    resetForm();
  }

  function resetForm() {
    setSelectedProduct(null);
    setSelectedOption(null);
    setCurrentQuantity(1);
  }

  console.log({ selectedProduct });

  if (!products.length) return null;

  return (
    <div className="space-y-6 px-6 py-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-[#2e2e2e]">
          Adicionar item
        </h2>
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1.5 block text-xs text-gray-500">
              Produto
            </label>
            <select
              value={selectedProduct?.id || ""}
              onChange={(e) => {
                const product =
                  products.find((p) => p.id === e.target.value) ?? null;
                setSelectedProduct(product);
              }}
              disabled={isLoadingProducts}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#2e2e2e] focus:ring-2 focus:ring-[#FF7622]/30 focus:outline-none disabled:opacity-50"
            >
              <option value="">Selecione um produto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCentsToReaisWithSymbol(p.value)}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div>
              <label className="mb-1.5 block text-xs text-gray-500">
                Sabor
              </label>
              <select
                value={selectedOption?.id}
                onChange={(e) => {
                  const option =
                    selectedProduct.productOptions?.find(
                      (o) => o.id === e.target.value,
                    ) ?? null;
                  setSelectedOption(option);
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#2e2e2e] focus:ring-2 focus:ring-[#FF7622]/30 focus:outline-none"
              >
                <option value="">Selecione um sabor</option>
                {(selectedProduct.productOptions ?? []).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            {selectedOption && (
              <QuantityController
                quantity={currentQuantity}
                maxQuantity={selectedOption.quantity}
                updateQuantity={setCurrentQuantity}
              />
            )}
            <button
              onClick={handleAddItem}
              type="button"
              disabled={!selectedProduct || !selectedOption}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#FF7622] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#e65c00] active:scale-[0.98] disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Adicionar item
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
