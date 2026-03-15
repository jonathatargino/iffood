import type { CartItem } from "@/contexts/cart/types";
import { formatCentsToReaisWithSymbol } from "@/utils/currency";
import { CartItemQuantityController } from "./components/CartItemQuantityController";

interface CartItemProps {
  item: CartItem;
}

export function CartItemUnit({ item }: CartItemProps) {
  return (
    <div key={item.productOption.id} className="flex w-full gap-4">
      <img
        src={item.product.photoUrl}
        alt={item.product.name}
        className="h-20 w-20 rounded-2xl object-cover"
      />
      <div className="flex flex-1">
        <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          <div className="mb-0.5 truncate text-sm font-medium text-[#2e2e2e]">
            {item.product.name}
          </div>
          <div className="mb-2 text-xs text-gray-400">
            {item.productOption.name}
          </div>
          <div className="text-sm font-medium text-[#FF7622]">
            {formatCentsToReaisWithSymbol(item.product.value)}
          </div>
        </div>

        <CartItemQuantityController
          productOptionId={item.productOption.id}
          quantity={item.quantity}
          maxQuantity={item.productOption.quantity}
        />
      </div>
    </div>
  );
}
