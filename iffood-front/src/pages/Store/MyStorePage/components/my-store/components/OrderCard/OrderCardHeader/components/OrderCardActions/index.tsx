import type { OrderRequestResponse } from "@/services/order-request";
import { OrderCardActionsPopover } from "./components/OrderCardActionsPopover";
import {
  useConcludeOrder,
  useRejectOrder,
} from "@/pages/Store/MyStorePage/hooks/use-order-mutations";
import { useNavigate } from "react-router";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { useState } from "react";
import { BouncingDots } from "@/components/BoucingDots";

interface OrderCardActionsProps {
  order: OrderRequestResponse;
}

export function OrderCardActions({ order }: OrderCardActionsProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);

  const navigate = useNavigate();

  const concludeMutation = useConcludeOrder(order.storeId);
  const rejectMutation = useRejectOrder(order.storeId, {
    onFinish: () => setShowRejectModal(false),
  });

  function handleViewOrderClick() {
    navigate(`/loja/minha-loja/pedidos/editar/${order.id}`);
  }

  return (
    <>
      <OrderCardActionsPopover>
        <div className="flex flex-col gap-2 text-sm">
          <button
            className="flex h-6 items-center justify-center"
            onClick={handleViewOrderClick}
          >
            Visualizar
          </button>
          <hr />
          <button
            className="flex h-6 items-center justify-center"
            onClick={() => concludeMutation.mutate(order.id)}
          >
            {concludeMutation.isPending ? <BouncingDots /> : "Confirmar"}
          </button>
          <hr />
          <button
            className="flex h-6 items-center justify-center"
            onClick={() => setShowRejectModal(true)}
          >
            Rejeitar
          </button>
        </div>
      </OrderCardActionsPopover>
      <ConfirmationModal
        isOpen={showRejectModal}
        title="Rejeitar pedido?"
        message="Tem certeza que deseja rejeitar este pedido? Esta ação não pode ser desfeita."
        confirmText="Rejeitar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={rejectMutation.isPending}
        onConfirm={() => {
          rejectMutation.mutate(order.id);
        }}
        onCancel={() => setShowRejectModal(false)}
      />
    </>
  );
}
