import { useState } from "react";
import type { Store, UpdateStoreData } from "@/services/store";
import { ConfirmationModal } from "@/components/confirmation-modal";
import {
  useUpdateStore,
  useDeleteStore,
} from "../../../hooks/use-store-mutations";
import { EditableStoreInfo } from "./editable-store-info";

type GeneralTabProps = {
  store: Store;
};

export function GeneralTab({ store }: GeneralTabProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const updateStoreMutation = useUpdateStore(store.id, () =>
    setIsEditing(false),
  );
  const deleteStoreMutation = useDeleteStore();

  const handleSaveGeneralInfo = (data: UpdateStoreData) => {
    updateStoreMutation.mutate(data);
  };

  const handleDeleteStore = () => {
    deleteStoreMutation.mutate(store.id);

    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="space-y-6 px-6">
        <EditableStoreInfo
          store={store}
          onSave={handleSaveGeneralInfo}
          isLoading={updateStoreMutation.isPending}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />

        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={deleteStoreMutation.isPending}
          className="w-full rounded-full bg-red-600 py-4 text-white uppercase shadow-lg transition-all hover:bg-red-700 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleteStoreMutation.isPending ? "Deletando..." : "Deletar Loja"}
        </button>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Deletar Loja"
        message="Tem certeza que deseja deletar esta loja? Esta ação não pode ser desfeita e todos os produtos serão removidos."
        confirmText="Deletar"
        cancelText="Cancelar"
        onConfirm={handleDeleteStore}
        onCancel={() => setShowDeleteModal(false)}
        variant="danger"
      />
    </>
  );
}
