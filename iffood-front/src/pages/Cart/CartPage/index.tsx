import { useCart } from "@/contexts/cart/context";
import { StoreInfoWidget } from "./components/StoreInfoWidget";
import { CartItemList } from "./components/CartItemList";
import { EmptyCartView } from "./views/EmptyCartView";

export function CartPage() {
  const { state } = useCart();

  if (state.items.length === 0) {
    return <EmptyCartView />;
  }

  return (
    <div className="min-h-screen bg-white pt-6 pb-48">
      <StoreInfoWidget />
      <CartItemList />
    </div>
  );
}

export default CartPage;
