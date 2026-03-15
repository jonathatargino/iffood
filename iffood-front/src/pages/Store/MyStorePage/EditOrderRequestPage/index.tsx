import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { orderRequestService } from "@/services/order-request";
import { productService } from "@/services/product";
import { useChangeAndConcludeOrder } from "../hooks/use-order-mutations";
import { formatCentsToReaisWithSymbol } from "@/utils/currency";

type EditItem = {
  productOptionId: string;
  productName: string;
  productOptionName: string;
  productValue: number;
  quantity: number;
};

export function EditOrderRequestPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [items, setItems] = useState<EditItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Add-item form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [addQty, setAddQty] = useState(1);

  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => orderRequestService.getById(orderId!),
    enabled: !!orderId,
  });

  const storeId = order?.storeId;

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["store-products-all", storeId],
    queryFn: () =>
      productService.getProductsByStore(storeId, { pageSize: 100 }),
    enabled: !!storeId,
  });

  const { data: selectedProduct } = useQuery({
    queryKey: ["product-detail", selectedProductId],
    queryFn: () => productService.getProductById(selectedProductId),
    enabled: !!selectedProductId,
  });

  const changeAndConcludeMutation = useChangeAndConcludeOrder(storeId ?? "");

  useEffect(() => {
    if (order && !initialized) {
      setItems(
        order.items.map((item) => ({
          productOptionId: item.productOptionId,
          productName: item.productName,
          productOptionName: item.productOptionName,
          productValue: item.productValue,
          quantity: item.quantity,
        })),
      );
      setInitialized(true);
    }
  }, [order, initialized]);

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedOption = selectedProduct?.productOptions?.find(
    (o) => o.id === selectedOptionId,
  );

  const handleAddItem = () => {
    if (!selectedProduct || !selectedOption) return;
    setItems((prev) => [
      ...prev,
      {
        productOptionId: selectedOption.id,
        productName: selectedProduct.name,
        productOptionName: selectedOption.name,
        productValue: selectedProduct.value,
        quantity: addQty,
      },
    ]);
    setSelectedProductId("");
    setSelectedOptionId("");
    setAddQty(1);
  };

  const handleSubmit = () => {
    if (!orderId || items.length === 0) return;
    changeAndConcludeMutation.mutate(
      {
        orderId,
        items: items.map(({ productOptionId, quantity }) => ({
          productOptionId,
          quantity,
        })),
      },
      { onSuccess: () => navigate("/loja/minha-loja") },
    );
  };

  const total = items.reduce(
    (sum, item) => sum + item.productValue * item.quantity,
    0,
  );

  const products = productsData?.data ?? [];

  if (isLoadingOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="size-12 animate-spin rounded-full border-4 border-[#FF7622] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-100 bg-white px-6 py-5">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center rounded-full bg-gray-100 transition-all active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-[#2e2e2e]">
            Editar Pedido
          </h1>
          {order?.buyerName && (
            <p className="text-xs text-gray-400">{order.buyerName}</p>
          )}
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        {/* Current items */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[#2e2e2e]">
            Itens do pedido
          </h2>

          {items.length === 0 ? (
            <p className="rounded-2xl border border-gray-100 bg-white py-6 text-center text-sm text-gray-400">
              Nenhum item. Adicione pelo menos um para continuar.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#2e2e2e]">
                      {item.productName}{" "}
                      <span className="font-normal text-gray-400">
                        ({item.productOptionName})
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {item.quantity}x ·{" "}
                      {formatCentsToReaisWithSymbol(
                        item.productValue * item.quantity,
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="ml-3 flex size-8 items-center justify-center rounded-full bg-red-50 text-red-500 transition-colors hover:bg-red-100 active:scale-95"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Total */}
        {items.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-sm font-semibold text-[#FF7622]">
              {formatCentsToReaisWithSymbol(total)}
            </span>
          </div>
        )}

        {/* Add item */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[#2e2e2e]">
            Adicionar item
          </h2>
          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            {/* Product */}
            <div>
              <label className="mb-1.5 block text-xs text-gray-500">
                Produto
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setSelectedOptionId("");
                  setAddQty(1);
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

            {/* Option / flavor */}
            {selectedProduct && (
              <div>
                <label className="mb-1.5 block text-xs text-gray-500">
                  Sabor
                </label>
                <select
                  value={selectedOptionId}
                  onChange={(e) => setSelectedOptionId(e.target.value)}
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

            {/* Quantity */}
            {selectedOptionId && (
              <div>
                <label className="mb-1.5 block text-xs text-gray-500">
                  Quantidade
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setAddQty((q) => Math.max(1, q - 1))}
                    className="flex size-9 items-center justify-center rounded-full border border-gray-200 text-lg text-gray-600 transition-all hover:bg-gray-50 active:scale-95"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-[#2e2e2e]">
                    {addQty}
                  </span>
                  <button
                    onClick={() => setAddQty((q) => q + 1)}
                    className="flex size-9 items-center justify-center rounded-full border border-gray-200 text-lg text-gray-600 transition-all hover:bg-gray-50 active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAddItem}
              disabled={!selectedProduct || !selectedOptionId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-[#2e2e2e] transition-colors hover:bg-gray-200 active:scale-[0.98] disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Adicionar item
            </button>
          </div>
        </section>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed right-0 bottom-0 left-0 border-t border-gray-100 bg-white px-6 py-4">
        <button
          onClick={handleSubmit}
          disabled={items.length === 0 || changeAndConcludeMutation.isPending}
          className="w-full rounded-full bg-linear-to-r from-[#FF7622] to-[#E6661A] py-3.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {changeAndConcludeMutation.isPending
            ? "Processando..."
            : "Alterar e Concluir"}
        </button>
      </div>
    </div>
  );
}

export default EditOrderRequestPage;
