import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router";
import { useCart } from "@/contexts/cart/context";

export function CartFloatButton() {
  const navigate = useNavigate();
  const { itemCount } = useCart();

  if (itemCount === 0) return null;

  return (
    <button
      onClick={() => navigate("/carrinho")}
      className="fixed bottom-6 right-6 z-50 size-14 bg-gradient-to-r from-[#FF7622] to-[#E6661A] text-white rounded-full shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center"
    >
      <ShoppingCart className="w-6 h-6" />
      <span className="absolute -top-1 -right-1 size-6 bg-white text-[#FF7622] text-xs font-bold rounded-full flex items-center justify-center shadow-md">
        {itemCount}
      </span>
    </button>
  );
}
