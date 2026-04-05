import { Minus, Plus, Trash2 } from "lucide-react";

interface OrderItemsEditQuantityControllerProps {
  quantity: number;
  maxQuantity: number;
  updateQuantity: (newQuantity: number) => void;
  onRemove?: () => void;
  allowRemove?: boolean;
  minimumQuantity?: number;
}

export function QuantityController({
  quantity,
  updateQuantity,
  maxQuantity,
  onRemove,
  allowRemove = false,
  minimumQuantity = 1,
}: OrderItemsEditQuantityControllerProps) {
  return (
    <div className="flex h-10 w-fit items-center justify-center rounded-md bg-gray-100 p-2">
      {quantity === minimumQuantity && allowRemove ? (
        <button type="button" onClick={onRemove}>
          <Trash2 height={16} width={16} className={"text-[#FF7622]"} />
        </button>
      ) : (
        <button type="button" onClick={() => updateQuantity(quantity - 1)}>
          <Minus
            height={16}
            width={16}
            className={`${quantity > minimumQuantity ? "text-[#FF7622]" : "text-gray-400"}`}
          />
        </button>
      )}

      <input
        type="number"
        value={quantity}
        onChange={(e) => updateQuantity(Number(e.target.value))}
        min={1}
        max={maxQuantity}
        className="w-10 [appearance:textfield] border-none bg-transparent text-center text-sm font-semibold text-gray-800 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={() => updateQuantity(quantity + 1)}
        disabled={quantity >= maxQuantity}
      >
        <Plus
          height={16}
          width={16}
          className={`${quantity < maxQuantity ? "text-[#FF7622]" : "text-gray-400"}`}
        />
      </button>
    </div>
  );
}
