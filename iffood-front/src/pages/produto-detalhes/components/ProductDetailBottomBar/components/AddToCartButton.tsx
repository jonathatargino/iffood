import { formatCentsToReais } from "@/utils/currency";
interface AddToCartButtonProps {
  canOrder: boolean;
  totalPrice: number;
  selectedFlavors: any[];
  handleAddToCart: () => void;
}

export function AddToCartButton({
  canOrder,
  handleAddToCart,
  totalPrice,
}: AddToCartButtonProps) {
  const shouldShowPrice = totalPrice > 0;

  return (
    <div className="flex-1">
      <button
        onClick={handleAddToCart}
        disabled={!canOrder}
        className={`w-full bg-[#FF7622] flex ${shouldShowPrice ? "justify-between" : "justify-center"} text-white py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400`}
      >
        Adicionar
        {shouldShowPrice && <span>R${formatCentsToReais(totalPrice)}</span>}
      </button>
    </div>
  );
}
