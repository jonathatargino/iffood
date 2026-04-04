import { WhatsappIcon } from "@/assets/whatsappIcon";
import { BouncingDots } from "@/components/BoucingDots";
import { Button } from "@/components/ui/button";
import { useOrder } from "@/contexts/order/context";
import { Link, useLocation } from "react-router";

export function CartCTAButton() {
  const { createOrder, isOrderCreating } = useOrder();

  const location = useLocation();

  const isInCheckout = location.pathname === "/carrinho";
  if (isInCheckout) {
    return (
      <Button
        className={"flex flex-1 items-center justify-center px-6 py-5"}
        onClick={createOrder}
        disabled={isOrderCreating}
      >
        {isOrderCreating ? (
          <BouncingDots colorClass="bg-white/60" />
        ) : (
          <>
            <WhatsappIcon color="#FFFFFF" size={6} />
            Enviar pedido
          </>
        )}
      </Button>
    );
  }

  return (
    <Link to="/carrinho">
      <Button className="px-6 py-5">Ver carrinho</Button>
    </Link>
  );
}
