import type { ProductDetailFormData } from "@/pages/produto-detalhes/schema";
import { Minus, Plus } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

export function ProductDetailBottomBarQuantityController() {
  const { control, watch } = useFormContext<ProductDetailFormData>();

  const quantity = watch("quantity");
  const selectedProductOption = watch("productOption");
  const productMaxQuantity = selectedProductOption?.quantity || 1;

  const canDecrease = quantity > 1;
  const canIncrease = quantity < productMaxQuantity;

  console.log({ productMaxQuantity });

  return (
    <Controller
      name="quantity"
      control={control}
      defaultValue={1}
      render={({ field: { value, onChange } }) => {
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange(value - 1)}
              disabled={!canDecrease}
            >
              <Minus
                height={24}
                width={24}
                className={`${canDecrease ? "text-[#FF7622]" : "text-gray-400"}`}
              />
            </button>

            <input
              type="number"
              value={value}
              onChange={onChange}
              min={1}
              className="w-10 [appearance:textfield] border-none bg-transparent text-center font-semibold text-gray-800 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />

            <button
              type="button"
              onClick={() => onChange(value + 1)}
              disabled={!canIncrease}
            >
              <Plus
                height={24}
                width={24}
                className={`${canIncrease ? "text-[#FF7622]" : "text-gray-400"}`}
              />
            </button>
          </div>
        );
      }}
    />
  );
}
