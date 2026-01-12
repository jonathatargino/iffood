import { useState } from "react";
import { Edit2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Store, UpdateStoreData } from "@/services/store";
import { storeService } from "@/services/store";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { PhotoUploadModal } from "@/components/photo-upload-modal";

interface MyStoreProps {
  store: Store;
}

type TabType = "general" | "availability" | "products";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="size-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center hover:bg-white transition-all active:scale-95"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M15 18l-6-6 6-6"
          stroke="#2e2e2e"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </button>
  );
}

function PhotoUploadButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="size-11 bg-white rounded-2xl shadow-xl flex items-center justify-center hover:shadow-2xl transition-all active:scale-95"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
        <path
          d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
          stroke="#2e2e2e"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </button>
  );
}

function Tab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 rounded-full whitespace-nowrap transition-all ${
        active
          ? "bg-[#FF7622] text-white shadow-lg"
          : "bg-white text-[#2e2e2e] hover:shadow-md"
      }`}
    >
      {children}
    </button>
  );
}

export function MyStore({ store }: MyStoreProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const [formData, setFormData] = useState<UpdateStoreData>({
    name: store.name,
    description: store.description,
    whatsapp: store.whatsapp,
  });

  const [whatsappDisplay, setWhatsappDisplay] = useState(() => {
    const numbers = store.whatsapp;
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
        7,
        11
      )}`;
    }
    return numbers;
  });

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
        7,
        11
      )}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7,
      11
    )}`;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    const numbers = e.target.value.replace(/\D/g, "");
    setWhatsappDisplay(formatted);
    setFormData({ ...formData, whatsapp: numbers });
  };

  const updateStoreMutation = useMutation({
    mutationFn: (data: UpdateStoreData) =>
      storeService.updateStore(store.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
      toast.success("Loja atualizada", {
        description: "As informações da loja foram atualizadas com sucesso.",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar loja", {
        description:
          "Não foi possível atualizar as informações. Tente novamente.",
      });
    },
  });

  const updatePhotoMutation = useMutation({
    mutationFn: (photo: File) => storeService.updateStorePhoto(store.id, photo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
      toast.success("Foto atualizada", {
        description: "A foto da loja foi atualizada com sucesso.",
      });
      setShowPhotoModal(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar foto", {
        description: "Não foi possível atualizar a foto. Tente novamente.",
      });
    },
  });

  const deleteStoreMutation = useMutation({
    mutationFn: () => storeService.deleteStore(store.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
      toast.success("Loja deletada", {
        description: "Sua loja foi deletada com sucesso.",
      });
    },
    onError: () => {
      toast.error("Erro ao deletar loja", {
        description: "Não foi possível deletar a loja. Tente novamente.",
      });
    },
  });

  const handleSaveGeneralInfo = () => {
    updateStoreMutation.mutate(formData);
  };

  const handlePhotoUpload = async (file: File) => {
    await updatePhotoMutation.mutateAsync(file);
  };

  const handleDeleteStore = () => {
    deleteStoreMutation.mutate();
    setShowDeleteModal(false);
  };

  return (
    <div className="bg-[#fafafa] min-h-screen pb-8">
      {/* Store Image Header */}
      <div className="relative h-[321px] w-full overflow-hidden">
        <img
          src={
            store.photoUrl ||
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
          }
          alt="Store"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

        {/* Header Buttons */}
        <div className="absolute left-6 right-6 top-14 flex justify-between">
          <BackButton onClick={() => window.history.back()} />
          <PhotoUploadButton onClick={() => setShowPhotoModal(true)} />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-6">
        <div className="overflow-x-auto scrollbar-hide mb-6">
          <div className="flex gap-2 pb-2">
            <Tab
              active={activeTab === "general"}
              onClick={() => setActiveTab("general")}
            >
              Geral
            </Tab>
            <Tab
              active={activeTab === "availability"}
              onClick={() => setActiveTab("availability")}
            >
              Disponibilidade
            </Tab>
            <Tab
              active={activeTab === "products"}
              onClick={() => setActiveTab("products")}
            >
              Produtos
            </Tab>
          </div>
        </div>

        {/* General Tab */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#2e2e2e]">Informações da Loja</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="size-10 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-[#2e2e2e]" />
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
                      Nome da Loja
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:border-[#FF7622] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:border-[#FF7622] transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      value={whatsappDisplay}
                      onChange={handleWhatsAppChange}
                      placeholder="(XX) XXXXX-XXXX"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:border-[#FF7622] transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleSaveGeneralInfo}
                    disabled={updateStoreMutation.isPending}
                    className="w-full bg-gradient-to-r from-[#FF7622] to-[#E6661A] text-white py-3 rounded-full uppercase transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateStoreMutation.isPending ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                      Nome da Loja
                    </div>
                    <div className="text-[#2e2e2e]">{store.name}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                      Descrição
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {store.description}
                    </p>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                      WhatsApp
                    </div>
                    <div className="text-[#2e2e2e]">{whatsappDisplay}</div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={deleteStoreMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-full uppercase transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteStoreMutation.isPending ? "Deletando..." : "Deletar Loja"}
            </button>
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === "availability" && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-center py-8">
              Funcionalidade em desenvolvimento
            </p>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-center py-8">
              Funcionalidade em desenvolvimento
            </p>
          </div>
        )}
      </div>

      {/* Delete Store Modal */}
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

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={showPhotoModal}
        title="Alterar Foto da Loja"
        onUpload={handlePhotoUpload}
        onClose={() => setShowPhotoModal(false)}
        isLoading={updatePhotoMutation.isPending}
      />
    </div>
  );
}
