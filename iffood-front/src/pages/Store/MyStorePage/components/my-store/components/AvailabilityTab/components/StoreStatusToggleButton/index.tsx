import { ConfirmationModal } from "@/components/ConfirmationModal";
import { useUpdateStoreStatus } from "@/pages/Store/MyStorePage/hooks/useStoreMutation";
import type { Store } from "@/services/store";
import { Check, X } from "lucide-react";
import { useState } from "react";

interface StoreStatusToggleButtonProps {
  store: Store;
}

export function StoreStatusToggleButton({
  store,
}: StoreStatusToggleButtonProps) {
  const [pendingStatus, setPendingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const isAvailable = store.isAvailable;
  const status = store.status;

  const updateStatusMutation = useUpdateStoreStatus(store.id, store);
  const confirmStatusChange = () => {
    updateStatusMutation.mutate(pendingStatus);
    setShowStatusModal(false);
  };

  const handleStatusToggle = () => {
    setPendingStatus(!store.status);
    setShowStatusModal(true);
  };

  if (!isAvailable && status) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleStatusToggle}
        className={`relative mr-2 h-9 w-16 rounded-full shadow-inner transition-all ${
          status ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow-md transition-all duration-300 ${
            status ? "right-1" : "left-1"
          }`}
        >
          <div className="flex h-full w-full items-center justify-center">
            {status ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      <ConfirmationModal
        isOpen={showStatusModal}
        title={pendingStatus ? "Ativar Loja" : "Desativar Loja"}
        message={
          pendingStatus
            ? "Você tem certeza que deseja ativar a loja? Seus produtos serão exibidos para os usuários."
            : "Você tem certeza que deseja deixar a loja inativa? Seus produtos não serão exibidos para os usuários e você não receberá novos pedidos."
        }
        confirmText={pendingStatus ? "Ativar" : "Desativar"}
        cancelText="Cancelar"
        onConfirm={confirmStatusChange}
        onCancel={() => setShowStatusModal(false)}
        variant={pendingStatus ? "default" : "danger"}
        isLoading={updateStatusMutation.isPending}
      />
    </>
  );
}
