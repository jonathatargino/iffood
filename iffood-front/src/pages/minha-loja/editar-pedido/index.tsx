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

export function EditarPedidoPage() {
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
      { onSuccess: () => navigate("/minha-loja") },
    );
  };

  const total = items.reduce(
    (sum, item) => sum + item.productValue * item.quantity,
    0,
  );

  const products = productsData?.data ?? [];

  if (isLoadingOrder) {
    return (
      <div className="bg-[#fafafa] min-h-screen flex items-center justify-center">
        <div className="size-12 border-4 border-[#FF7622] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#fafafa] min-h-screen pb-32">
      {/* Header */}
      <div className="bg-white px-6 py-5 flex items-center gap-4 border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="size-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
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

      <div className="px-6 py-6 space-y-6">
        {/* Current items */}
        <section>
          <h2 className="text-sm font-semibold text-[#2e2e2e] mb-3">
            Itens do pedido
          </h2>

          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6 bg-white rounded-2xl border border-gray-100">
              Nenhum item. Adicione pelo menos um para continuar.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2e2e2e]">
                      {item.productName}{" "}
                      <span className="text-gray-400 font-normal">
                        ({item.productOptionName})
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.quantity}x ·{" "}
                      {formatCentsToReaisWithSymbol(
                        item.productValue * item.quantity,
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="ml-3 size-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Total */}
        {items.length > 0 && (
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-100">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-sm font-semibold text-[#FF7622]">
              {formatCentsToReaisWithSymbol(total)}
            </span>
          </div>
        )}

        {/* Add item */}
        <section>
          <h2 className="text-sm font-semibold text-[#2e2e2e] mb-3">
            Adicionar item
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            {/* Product */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
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
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#2e2e2e] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7622]/30 disabled:opacity-50"
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
                <label className="text-xs text-gray-500 mb-1.5 block">
                  Sabor
                </label>
                <select
                  value={selectedOptionId}
                  onChange={(e) => setSelectedOptionId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#2e2e2e] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7622]/30"
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
                <label className="text-xs text-gray-500 mb-1.5 block">
                  Quantidade
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setAddQty((q) => Math.max(1, q - 1))}
                    className="size-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all text-lg"
                  >
                    −
                  </button>
                  <span className="text-sm font-semibold text-[#2e2e2e] w-6 text-center">
                    {addQty}
                  </span>
                  <button
                    onClick={() => setAddQty((q) => q + 1)}
                    className="size-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAddItem}
              disabled={!selectedProduct || !selectedOptionId}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-[#2e2e2e] py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-200 transition-colors active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Adicionar item
            </button>
          </div>
        </section>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
        <button
          onClick={handleSubmit}
          disabled={items.length === 0 || changeAndConcludeMutation.isPending}
          className="w-full bg-linear-to-r from-[#FF7622] to-[#E6661A] text-white py-3.5 rounded-full text-sm font-semibold shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {changeAndConcludeMutation.isPending
            ? "Processando..."
            : "Alterar e Concluir"}
        </button>
      </div>
    </div>
  );
}
