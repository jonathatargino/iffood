import { useCallback, useState } from "react";
import { OrderContext } from "./context";
import { useMutation } from "@tanstack/react-query";
import { orderRequestService } from "@/services/order-request";
import { useCart } from "../cart/context";
import { toast } from "sonner";
import { LoginRequiredModal } from "./components/LoginRequiredModal";
import { WhatsappRequiredModal } from "./components/WhatsappRequiredModal";
import { useAuth } from "../auth/context";

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [openModal, setOpenModal] = useState<
    "login_required" | "whatsapp_required" | "none"
  >("none");

  const { userProfile, session } = useAuth();
  const cart = useCart();

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
    },
    onError: (error: any) => {
      toast.error("Erro ao criar pedido", {
        description: "Tente novamente mais tarde.",
      });
      console.error(error);
    },
  });

  const createOrder = useCallback(() => {
    if (!session) {
      setOpenModal("login_required");
      return;
    }

    if (!userProfile?.whatsapp) {
      setOpenModal("whatsapp_required");
      return;
    }

    createOrderMutation.mutate();
  }, [createOrderMutation, userProfile, session]);

  return (
    <OrderContext.Provider
      value={{
        createOrder,
        isOrderCreating: createOrderMutation.isPending,
      }}
    >
      {children}
      <LoginRequiredModal
        isOpen={openModal === "login_required"}
        onClose={() => setOpenModal("none")}
      />
      <WhatsappRequiredModal
        isOpen={openModal === "whatsapp_required"}
        onClose={() => setOpenModal("none")}
      />
    </OrderContext.Provider>
  );
}
