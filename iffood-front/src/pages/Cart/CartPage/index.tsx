import { useCart } from "@/contexts/cart/context";
import { StoreInfoWidget } from "./components/StoreInfoWidget";
import { CartItemList } from "./components/CartItemList";
import { PageHeader } from "@/components/PageHeader";
import { Navigate } from "react-router";

export function CartPage() {
  const { state } = useCart();

  if (state.items.length === 0) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-white pb-48">
      <PageHeader text="CARRINHO" />
      <StoreInfoWidget />
      <CartItemList />
    </div>
  );
}

export default CartPage;
