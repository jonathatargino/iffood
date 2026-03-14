import { Minus, Plus } from "lucide-react";

interface ProductDetailBottomBarQuantityControllerProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  productMaxQuantity: number;
}

export function ProductDetailBottomBarQuantityController({
  onQuantityChange,
  quantity,
  productMaxQuantity,
}: ProductDetailBottomBarQuantityControllerProps) {
  const canDecrease = quantity > 1;
  const canIncrease = quantity < productMaxQuantity;

  return (
    <div className="flex items-center gap-2">
      <button>
        <Minus
          height={24}
          width={24}
          className={`${canDecrease ? "text-[#FF7622]" : "text-gray-400"}`}
        />
      </button>

      <input
        type="number"
        defaultValue={1}
        min={1}
        className="w-10 text-center font-semibold text-gray-800 bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <button>
        <Plus
          height={24}
          width={24}
          className={`${canIncrease ? "text-[#FF7622]" : "text-gray-400"}`}
        />
      </button>
    </div>
  );
}
