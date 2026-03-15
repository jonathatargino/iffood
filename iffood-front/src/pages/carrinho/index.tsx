import { useNavigate } from "react-router";
import { Minus, Plus, Trash2, ShoppingCart, ChevronLeft } from "lucide-react";
import { useCart } from "@/contexts/cart/context";
import {
  formatCentsToReais,
  formatCentsToReaisWithSymbol,
} from "@/utils/currency";
import { orderRequestService } from "@/services/order-request";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function CartPage() {
  const navigate = useNavigate();
  const { state, removeItem, updateQuantity, clearCart, itemCount, total } =
    useCart();

  const createOrderMutation = useMutation({
    mutationFn: () =>
      orderRequestService.createOrder({
        cartId: state.cartId,
        storeId: state.storeId!,
        items: state.items.map((item) => ({
          productId: item.product.id,
          productOptionId: item.productOption.id,
          quantity: item.quantity,
        })),
      }),
    onSuccess: (data) => {
      clearCart();
      window.open(data.whatsappUrl, "_blank");
      toast.success("Pedido criado com sucesso!");
      navigate("/");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "";
      if (message.includes("OUT_OF_STOCK")) {
        toast.error("Estoque insuficiente", {
          description:
            "Um ou mais itens do carrinho excedem o estoque disponível.",
        });
      } else if (message.includes("MULTIPLE_STORES_NOT_ALLOWED")) {
        toast.error("Erro de loja", {
          description: "Todos os itens devem ser da mesma loja.",
        });
      } else {
        toast.error("Erro ao criar pedido", {
          description: "Tente novamente mais tarde.",
        });
      }
    },
  });

  const handleFinalize = () => {
    if (state.items.length === 0 || !state.storeId) return;
    createOrderMutation.mutate();
  };

  if (state.items.length === 0) {
    return (
      <div className="bg-[#fafafa] min-h-screen">
        <div className="bg-gradient-to-br from-[#FF7622] to-[#E6661A] px-6 pt-14 pb-8 rounded-b-[32px] shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="size-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center hover:bg-white transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-[#2e2e2e]" />
            </button>
            <h1 className="text-white text-lg">Carrinho</h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-6 pt-24">
          <div className="size-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-[#2e2e2e] text-lg mb-2">Carrinho vazio</h2>
          <p className="text-gray-400 text-sm text-center mb-8">
            Adicione produtos ao carrinho para fazer um pedido
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-[#FF7622] to-[#E6661A] text-white py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            Ver produtos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fafafa] min-h-screen pb-48">
      <div className="bg-gradient-to-br from-[#FF7622] to-[#E6661A] px-6 pt-14 pb-8 rounded-b-[32px] shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="size-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center hover:bg-white transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-[#2e2e2e]" />
          </button>
          <div className="flex-1">
            <h1 className="text-white text-lg">Carrinho</h1>
            <p className="text-white/80 text-sm">
              {state.storeName} - {itemCount}{" "}
              {itemCount === 1 ? "item" : "itens"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {state.items.map((item) => (
          <div
            key={item.productOption.id}
            className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex gap-4"
          >
            <img
              src={item.product.photoUrl}
              alt={item.product.name}
              className="w-20 h-20 rounded-2xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#2e2e2e] font-medium mb-0.5 truncate">
                {item.product.name}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                {item.productOption.name}
              </div>
              <div className="text-sm text-[#FF7622] font-medium">
                {formatCentsToReaisWithSymbol(item.product.value)}
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.productOption.id, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                    className={`size-7 rounded-full flex items-center justify-center transition-all ${
                      item.quantity <= 1
                        ? "bg-gray-200 text-gray-400"
                        : "bg-[#FF7622] text-white active:scale-95"
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm text-[#2e2e2e] min-w-[24px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productOption.id, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.productOption.quantity}
                    className={`size-7 rounded-full flex items-center justify-center transition-all ${
                      item.quantity >= item.productOption.quantity
                        ? "bg-gray-200 text-gray-400"
                        : "bg-[#FF7622] text-white active:scale-95"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.productOption.id)}
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 shadow-2xl">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Total</div>
              <div className="text-2xl text-[#FF7622]">
                R$ {formatCentsToReais(total)}
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {itemCount} {itemCount === 1 ? "item" : "itens"}
            </div>
          </div>
          <button
            onClick={handleFinalize}
            disabled={createOrderMutation.isPending}
            className="w-full bg-gradient-to-r from-[#FF7622] to-[#E6661A] text-white py-4 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-5 h-5" />
            {createOrderMutation.isPending
              ? "Finalizando..."
              : "Finalizar Pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}
