import type { ProductDetailFormData } from "@/pages/produto-detalhes/schema";
import type { ProductOption } from "@/services/product";
import { Controller, useFormContext } from "react-hook-form";

interface ProductOptionSingleSelectionProps {
  productOption: ProductOption;
}

export function ProductOptionSingleSelection({
  productOption,
}: ProductOptionSingleSelectionProps) {
  const { control, watch } = useFormContext<ProductDetailFormData>();
  const selectedOption = watch("productOption");

  const isOutOfStoke = productOption.quantity <= 0;

  return (
    <div className="flex cursor-pointer items-center justify-between px-4 py-5 text-sm font-medium text-gray-800">
      <div className="flex flex-col">
        <label
          className={`text-sm ${isOutOfStoke ? "text-gray-300" : ""}`}
          htmlFor={productOption.id}
        >
          {productOption.name}
        </label>
        {isOutOfStoke && (
          <span className="text-xs text-red-400">Indisponível</span>
        )}
      </div>
      <Controller
        control={control}
        name="productOption"
        render={({ field: { onChange } }) => (
          <input
            id={productOption.id}
            disabled={isOutOfStoke}
            onChange={() => onChange(productOption)}
            type="radio"
            className="h-5 w-5 accent-[#FF7622]"
            checked={selectedOption?.id === productOption.id}
          />
        )}
      />
    </div>
  );
}
