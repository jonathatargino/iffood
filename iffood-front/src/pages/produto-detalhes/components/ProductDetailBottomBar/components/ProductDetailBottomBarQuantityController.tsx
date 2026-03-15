import type { ProductDetailFormData } from "@/pages/produto-detalhes/schema";
import { Minus, Plus } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

interface ProductDetailBottomBarQuantityControllerProps {
  productMaxQuantity: number;
}

export function ProductDetailBottomBarQuantityController({
  productMaxQuantity,
}: ProductDetailBottomBarQuantityControllerProps) {
  const { control, watch } = useFormContext<ProductDetailFormData>();

  const quantity = watch("quantity");

  const canDecrease = quantity > 1;
  const canIncrease = quantity < productMaxQuantity;

  return (
    <Controller
      name="quantity"
      control={control}
      defaultValue={1}
      render={({ field: { value, onChange } }) => {
        return (
          <div className="flex items-center gap-2">
            <button onClick={() => onChange(value - 1)} disabled={!canDecrease}>
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
              className="w-10 text-center font-semibold text-gray-800 bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />

            <button onClick={() => onChange(value + 1)} disabled={!canIncrease}>
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
