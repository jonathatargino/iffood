import type { ProductDetailFormData } from "@/pages/produto-detalhes/schema";
import { formatCentsToReais } from "@/utils/currency";
import { useFormContext } from "react-hook-form";

interface AddToCartButtonProps {
  productValue: number;
}

export function AddToCartButton({ productValue }: AddToCartButtonProps) {
  const {
    watch,
    formState: { isValid },
  } = useFormContext<ProductDetailFormData>();

  const quantity = watch("quantity");

  const totalPrice = productValue * quantity;
  const shouldShowPrice = totalPrice > 0 && isValid;

  return (
    <div className="flex-1">
      <button
        type="submit"
        form="product-detail-form"
        disabled={!isValid}
        className={`w-full bg-[#FF7622] flex ${shouldShowPrice ? "justify-between" : "justify-center"} text-white py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400`}
      >
        Adicionar
        {shouldShowPrice && <span>R${formatCentsToReais(totalPrice)}</span>}
      </button>
    </div>
  );
}
