import { WhatsappIcon } from "@/assets/whatsappIcon";
import { BouncingDots } from "@/components/BoucingDots";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart/context";
import { orderRequestService } from "@/services/order-request";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

export function CartCTAButton() {
  const cart = useCart();
  const navigate = useNavigate();

  const location = useLocation();

  const isInCheckout = location.pathname === "/carrinho";

  const createOrderMutation = useMutation({
    mutationFn: () =>
      orderRequestService.createOrder({
        cartId: cart.state.cartId,
        storeId: cart.state.store?.id!,
        items: cart.state.items.map((item) => ({
          productId: item.product.id,
          productOptionId: item.productOption.id,
          quantity: item.quantity,
        })),
      }),
    onSuccess: (data) => {
      cart.clearCart();
      window.open(data.whatsappUrl, "_blank");
      toast.success("Pedido criado com sucesso!");
      navigate("/");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar pedido", {
        description: "Tente novamente mais tarde.",
      });
      console.error(error);
    },
  });

  const isLoading = createOrderMutation.isPending;

  if (isInCheckout) {
    return (
      <Button
        className={"flex flex-1 items-center justify-center px-6 py-5"}
        onClick={() => createOrderMutation.mutate()}
        disabled={isLoading}
      >
        {isLoading ? (
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
      <Button className="flex-1 px-6 py-5">Ver carrinho</Button>
    </Link>
  );
}
