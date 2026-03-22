import { useCart } from "@/contexts/cart/context";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItemQuantityControllerProps {
  quantity: number;
  productOptionId: string;
  maxQuantity: number;
}

export function CartItemQuantityController({
  quantity,
  productOptionId,
  maxQuantity,
}: CartItemQuantityControllerProps) {
  const { updateQuantity, removeItem } = useCart();

  const handleTrashClick = () => {
    removeItem(productOptionId);
  };

  const handleMinusClick = () => {
    updateQuantity(productOptionId, quantity - 1);
  };

  const handlePlusClick = () => {
    updateQuantity(productOptionId, quantity + 1);
  };

  return (
    <div className="flex h-fit items-center rounded-md bg-gray-100 p-2">
      {quantity === 1 ? (
        <button type="button" onClick={handleTrashClick}>
          <Trash2 height={16} width={16} className={"text-[#FF7622]"} />
        </button>
      ) : (
        <button type="button" onClick={handleMinusClick}>
          <Minus
            height={16}
            width={16}
            className={`${quantity > 1 ? "text-[#FF7622]" : "text-gray-400"}`}
          />
        </button>
      )}

      <input
        type="number"
        value={quantity}
        onChange={(e) =>
          updateQuantity(productOptionId, Number(e.target.value))
        }
        min={1}
        max={maxQuantity}
        className="w-10 [appearance:textfield] border-none bg-transparent text-center text-sm font-semibold text-gray-800 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={handlePlusClick}
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
