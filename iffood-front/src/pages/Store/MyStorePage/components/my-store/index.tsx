import { useState } from "react";
import type { Store } from "@/services/store";
import { PhotoUploadModal } from "@/components/photo-upload-modal";
import { useUpdateStorePhoto } from "../../hooks/use-store-mutations";
import { StoreHeader } from "./components/store-header";
import { TabsContainer } from "./components/tabs";
import { GeneralTab } from "./components/general-tab";
import { ProductsTab } from "./ProductsTab";
import { OrdersTab } from "./components/orders-tab";
import type { TabType } from "./types";
import { useNavigate } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { AvailabilityTab } from "./components/AvailabilityTab";

type MyStoreProps = {
  store: Store;
};

const tabLabels: Record<TabType, string> = {
  general: "Geral",
  availability: "Disponibilidade",
  products: "Produtos",
  orders: "Pedidos",
};

export function MyStore({ store }: MyStoreProps) {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const nagivate = useNavigate();

  const updatePhotoMutation = useUpdateStorePhoto(store.id, () =>
    setShowPhotoModal(false),
  );

  const handlePhotoUpload = async (file: File) => {
    await updatePhotoMutation.mutateAsync(file);
  };

  return (
    <div className="min-h-screen bg-white pb-8">
      <PageHeader
        text={`Minha loja - ${tabLabels[activeTab]}`}
        hideWhenNotScrolled
      />
      <StoreHeader
        photoUrl={store.photoUrl}
        onBack={() => nagivate("/")}
        onPhotoUpload={() => setShowPhotoModal(true)}
      />

      <div className="py-6">
        <div className="px-6">
          <TabsContainer activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div>
          {activeTab === "general" && <GeneralTab store={store} />}

          {activeTab === "availability" && <AvailabilityTab store={store} />}

          {activeTab === "products" && <ProductsTab storeId={store.id} />}

          {activeTab === "orders" && <OrdersTab storeId={store.id} />}
        </div>
      </div>

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
