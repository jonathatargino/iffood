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
    setIsEditing(false)
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
      <div className="space-y-6">
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
          className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-full uppercase transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
