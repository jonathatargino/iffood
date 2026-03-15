import { useCart } from "@/contexts/cart/context";
import { formatCentsToReais } from "@/utils/currency";

export function CurrentStoreInfo() {
  const {
    state: { store },
    total,
    itemCount,
  } = useCart();

  return (
    <div className="flex gap-2">
      <img
        className="h-9 w-9 rounded-full"
        src={store?.photoUrl}
        alt={store?.name}
      />
      <div className="flex flex-col">
        <p className="text-xs">
          Total <span className="font-bold text-[#FF7622]">sem taxas</span>
        </p>
        <p className="font-bold">
          R$ {formatCentsToReais(total)}{" "}
          <span className="text-xs font-normal text-gray-500">
            / {itemCount} {itemCount === 1 ? "item" : "itens"}
          </span>
        </p>
      </div>
    </div>
  );
}
