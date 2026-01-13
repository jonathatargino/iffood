import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, MessageCircle, Package } from "lucide-react";
import { productService } from "@/services/product";
import {
  formatCentsToReaisWithSymbol,
  formatCentsToReais,
} from "@/utils/currency";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="size-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center hover:bg-white transition-all active:scale-95"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M15 18l-6-6 6-6"
          stroke="#2e2e2e"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </button>
  );
}

export function ProductDetail() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [quantity, setQuantity] = useState(1);
  const [selectedFlavor, setSelectedFlavor] = useState<any | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product-public", productId],
    queryFn: () => productService.getProductById(productId!),
    enabled: !!productId,
  });

  const productFlavors = product?.productOptions || [];
  const totalStock = productFlavors.reduce((sum, f) => sum + f.quantity, 0);

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (selectedFlavor && quantity < selectedFlavor.quantity) {
      setQuantity(quantity + 1);
    } else if (!selectedFlavor) {
      setQuantity(quantity + 1);
    }
  };

  const handleFlavorSelect = (flavor: any) => {
    if (flavor.quantity > 0) {
      setSelectedFlavor(flavor);
      if (quantity > flavor.quantity) {
        setQuantity(1);
      }
    }
  };

  const handleWhatsAppOrder = () => {
    if (!product) return;

    const message = `Olá! Gostaria de pedir:\n\n${product.name}${
      selectedFlavor ? ` - ${selectedFlavor.name}` : ""
    }\nQuantidade: ${quantity}\nValor: R$ ${formatCentsToReais(
      product.value * quantity
    )}`;
    const whatsappUrl = `https://wa.me/55${
      product.store?.whatsapp
    }?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="bg-[#fafafa] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-[#FF7622] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-[#fafafa] min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Produto não encontrado</p>
      </div>
    );
  }

  const totalPrice = product.value * quantity;
  const canOrder = selectedFlavor && selectedFlavor.quantity > 0;

  return (
    <div className="bg-[#fafafa] min-h-screen pb-24">
      {/* Product Image */}
      <div className="relative h-[321px] w-full overflow-hidden">
        <img
          src={product.photoUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

        {/* Back Button */}
        <div className="absolute left-6 top-14">
          <BackButton onClick={() => navigate(-1)} />
        </div>

        {/* Stock Badge */}
        <div
          className={`absolute top-14 right-6 px-4 py-2 rounded-full backdrop-blur-md ${
            totalStock === 0
              ? "bg-red-600/90 text-white"
              : totalStock <= 10
              ? "bg-amber-500/90 text-white"
              : "bg-green-600/90 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="text-sm">
              {totalStock === 0 ? "Esgotado" : `${totalStock} disponíveis`}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Product Info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="text-sm text-gray-500 mb-2">
            {product.store?.name}
          </div>
          <h1 className="text-[#181c2e] mb-3">{product.name}</h1>
          <p className="text-sm text-[#93969a] leading-relaxed mb-4">
            {product.description}
          </p>
          <div className="text-2xl text-[#FF7622]">
            {formatCentsToReaisWithSymbol(product.value)}
          </div>
        </div>

        {/* Flavors Selection */}
        {productFlavors && productFlavors.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#181c2e]">Escolha o sabor</h3>
              <span className="text-xs text-gray-400 uppercase tracking-wider">
                {productFlavors.filter((f: any) => f.quantity > 0).length}{" "}
                disponíveis
              </span>
            </div>
            <div className="space-y-2">
              {productFlavors.map((flavor: any) => {
                const isOutOfStock = flavor.quantity === 0;
                const isLowStock = flavor.quantity > 0 && flavor.quantity <= 3;
                const isSelected = selectedFlavor?.id === flavor.id;

                return (
                  <button
                    key={flavor.id}
                    onClick={() => handleFlavorSelect(flavor)}
                    disabled={isOutOfStock}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${
                      isOutOfStock
                        ? "bg-gray-100 border-2 border-gray-200 cursor-not-allowed opacity-60"
                        : isSelected
                        ? "bg-[#FFF5ED] border-2 border-[#FF7622] shadow-sm"
                        : "bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-[#FF7622] border-[#FF7622]"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="size-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <span
                          className={`text-sm block ${
                            isOutOfStock ? "text-gray-400" : "text-[#2e2e2e]"
                          }`}
                        >
                          {flavor.name}
                        </span>
                        {isLowStock && !isOutOfStock && (
                          <span className="text-xs text-amber-600">
                            Últimas {flavor.quantity} unidades
                          </span>
                        )}
                      </div>
                    </div>
                    {isOutOfStock ? (
                      <span className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded-full uppercase tracking-wider">
                        Esgotado
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {flavor.quantity} em estoque
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity Selector */}
        {selectedFlavor && selectedFlavor.quantity > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[#181c2e] mb-1">Quantidade</h3>
                <p className="text-xs text-gray-400">
                  Máximo: {selectedFlavor.quantity} unidades
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDecrease}
                  disabled={quantity <= 1}
                  className={`size-10 rounded-full flex items-center justify-center transition-all ${
                    quantity <= 1
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                      : "bg-[#FF7622] text-white hover:bg-[#E6661A] active:scale-95"
                  }`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl text-[#2e2e2e] min-w-[40px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrease}
                  disabled={quantity >= selectedFlavor.quantity}
                  className={`size-10 rounded-full flex items-center justify-center transition-all ${
                    quantity >= selectedFlavor.quantity
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                      : "bg-[#FF7622] text-white hover:bg-[#E6661A] active:scale-95"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Total</div>
            <div className="text-2xl text-[#FF7622]">
              R$ {formatCentsToReais(totalPrice)}
            </div>
          </div>
          <button
            onClick={handleWhatsAppOrder}
            disabled={!canOrder}
            className="flex-1 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white py-4 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400"
          >
            <MessageCircle className="w-5 h-5" />
            {!selectedFlavor
              ? "Selecione um sabor"
              : canOrder
              ? "Pedir no WhatsApp"
              : "Indisponível"}
          </button>
        </div>
      </div>
    </div>
  );
}
