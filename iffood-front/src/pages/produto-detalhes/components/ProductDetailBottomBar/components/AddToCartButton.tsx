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
        className={`flex w-full bg-[#FF7622] ${shouldShowPrice ? "justify-between" : "justify-center"} rounded-md px-6 py-4 text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-500`}
      >
        Adicionar
        {shouldShowPrice && <span>R${formatCentsToReais(totalPrice)}</span>}
      </button>
    </div>
  );
}
