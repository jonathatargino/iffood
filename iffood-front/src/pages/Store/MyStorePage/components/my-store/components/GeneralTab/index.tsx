import { useState } from "react";
import type { Store } from "@/services/store";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { useDeleteStore } from "../../../../hooks/use-store-mutations";
import { SectionHeader } from "@/components/SectionHeader";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreGeneralInfoForm } from "./components/StoreGeneralInfoForm";
import { StoreGeneralInfo } from "./components/StoreGeneralInfo";

type GeneralTabProps = {
  store: Store;
};

export function GeneralTab({ store }: GeneralTabProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const deleteStoreMutation = useDeleteStore();

  const handleDeleteStore = () => {
    deleteStoreMutation.mutate(store.id);

    setShowDeleteModal(false);
  };

  return (
    <>
      <SectionHeader
        title="Informações da loja"
        actions={
          <div className="flex flex-row gap-4">
            <Button size="icon" onClick={() => setIsEditing(!isEditing)}>
              <Edit className="size-4.5 text-white" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="size-4.5 text-white" />
            </Button>
          </div>
        }
      />

      <div className="mt-4 space-y-6 px-6">
        {isEditing ? (
          <StoreGeneralInfoForm
            store={store}
            onSuccess={() => setIsEditing(false)}
          />
        ) : (
          <StoreGeneralInfo store={store} />
        )}
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
