import { useCart } from "@/contexts/cart/context";
import { Link } from "react-router";

export function AddMoreItemsCTA() {
  const {
    state: { store },
  } = useCart();

  if (!store) return null;

  return (
    <Link to={`/loja/${store.id}`} className="text-xs font-bold text-[#FF7622]">
      Adicionar mais itens
    </Link>
  );
}
