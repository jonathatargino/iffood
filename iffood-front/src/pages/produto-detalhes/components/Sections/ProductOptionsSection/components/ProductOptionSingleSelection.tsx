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

  return (
    <div className="flex items-center justify-between py-5 cursor-pointer text-sm font-medium text-gray-800 px-4">
      <label htmlFor={productOption.id}>{productOption.name}</label>

      <Controller
        control={control}
        name="productOption"
        render={({ field: { onChange } }) => (
          <input
            id={productOption.id}
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
