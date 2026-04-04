import { useState } from "react";
import type { Store } from "@/services/store";
import { PhotoUploadModal } from "@/components/PhotoUploadModal";
import { useUpdateStorePhoto } from "../../hooks/useStoreMutation";
import { TabsContainer } from "./components/Tabs";
import { GeneralTab } from "./components/GeneralTab";
import { ProductsTab } from "./ProductsTab";
import { OrdersTab } from "./components/OrderTab";
import type { TabType } from "./types";
import { PageHeader } from "@/components/PageHeader";
import { AvailabilityTab } from "./components/AvailabilityTab";
import { StoreHeader } from "./components/StoreHeader";

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
