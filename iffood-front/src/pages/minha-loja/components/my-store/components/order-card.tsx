import { formatCentsToReaisWithSymbol } from "@/utils/currency";
import type { OrderRequestResponse } from "@/services/order-request";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  CONCLUDED: "Concluído",
  REJECTED: "Rejeitado",
  CHANGED_AND_CONCLUDED: "Alterado e Concluído",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONCLUDED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CHANGED_AND_CONCLUDED: "bg-blue-100 text-blue-700",
};

type OrderCardProps = {
  order: OrderRequestResponse;
  onConclude: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string) => void;
  isConcluding: boolean;
  isRejecting: boolean;
};

export function OrderCard({
  order,
  onConclude,
  onReject,
  onEdit,
  isConcluding,
  isRejecting,
}: OrderCardProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const isPending = order.status === "PENDING";
  const date = new Date(order.createdAt);
  const formattedDate = `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-medium text-[#2e2e2e]">
            {order.buyerName}
          </div>
          <div className="text-xs text-gray-400">{formattedDate}</div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"
          }`}
        >
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-sm"
          >
            <div className="text-[#2e2e2e]">
              {item.quantity}x {item.productName}{" "}
              <span className="text-gray-500 font-normal">
                ({item.productOptionName})
              </span>
            </div>
            <div className="text-gray-500">
              {formatCentsToReaisWithSymbol(item.productValue * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="text-sm font-medium text-[#FF7622]">
          Total: {formatCentsToReaisWithSymbol(order.total)}
        </div>
      </div>

      {isPending && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onEdit(order.id)}
            className="flex-1 bg-gray-100 text-[#2e2e2e] py-2.5 rounded-full text-sm font-medium transition-all active:scale-95"
          >
            Editar
          </button>
          <button
            onClick={() => onConclude(order.id)}
            disabled={isConcluding}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-full text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
          >
            {isConcluding ? "..." : "Concluir"}
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isRejecting}
            className="flex-1 bg-red-600 text-white py-2.5 rounded-full text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
          >
            {isRejecting ? "..." : "Rejeitar"}
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={showRejectModal}
        title="Rejeitar pedido?"
        message="Tem certeza que deseja rejeitar este pedido? Esta ação não pode ser desfeita."
        confirmText="Rejeitar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isRejecting}
        onConfirm={() => {
          onReject(order.id);
          setShowRejectModal(false);
        }}
        onCancel={() => setShowRejectModal(false)}
      />
    </div>
  );
}
