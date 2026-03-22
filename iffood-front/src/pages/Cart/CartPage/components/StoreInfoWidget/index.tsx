import { useCart } from "@/contexts/cart/context";
import { AddMoreItemsCTA } from "../AddMoreItemsCTA";

export function StoreInfoWidget() {
  const {
    state: { store },
  } = useCart();

  if (!store) return null;

  return (
    <div className="flex items-center gap-2 px-6">
      <img
        src={store.photoUrl}
        alt={store.name}
        className="h-9 w-9 rounded-full"
      />
      <div className="flex flex-col">
        <p className="">{store.name}</p>
        <AddMoreItemsCTA />
      </div>
    </div>
  );
}
