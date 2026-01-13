import { useState, useEffect } from "react";
import { Edit2, Package, X, Check } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { Store, UpdateStoreData } from "@/services/store";
import { storeService } from "@/services/store";
import { productService, type ProductWithCounts } from "@/services/product";
import {
  storeAvailabilityService,
  type UpdateStoreAvailabilityUnit,
} from "@/services/store-availability";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { PhotoUploadModal } from "@/components/photo-upload-modal";

interface MyStoreProps {
  store: Store;
}

type TabType = "general" | "availability" | "products";

interface WeekDay {
  weekday: number;
  name: string;
  enabled: boolean;
  start: string;
  end: string;
}

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

function WeekDayRow({
  day,
  onChange,
}: {
  day: WeekDay;
  onChange: (day: WeekDay) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-4 mb-3">
        <button
          onClick={() => onChange({ ...day, enabled: !day.enabled })}
          className={`size-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            day.enabled ? "bg-[#FF7622] border-[#FF7622]" : "border-gray-300"
          }`}
        >
          {day.enabled && (
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          )}
        </button>
        <span className="text-[#2e2e2e] flex-1">{day.name}</span>
      </div>

      {day.enabled && (
        <div className="flex flex-col gap-2 pl-9">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 min-w-[50px]">Início</label>
            <input
              type="time"
              value={day.start}
              onChange={(e) => onChange({ ...day, start: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#FF7622]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 min-w-[50px]">Fim</label>
            <input
              type="time"
              value={day.end}
              onChange={(e) => onChange({ ...day, end: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#FF7622]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  onEdit,
}: {
  product: ProductWithCounts;
  onEdit: () => void;
}) {
  const hasLowStock =
    product.accumulativeProductOptionsCount > 0 &&
    product.accumulativeProductOptionsCount <= 5;
  const isOutOfStock = product.accumulativeProductOptionsCount === 0;

  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden border border-gray-100">
      <div className="relative h-[110px] w-full overflow-hidden">
        <img
          src={product.photoUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div
          className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs backdrop-blur-md ${
            isOutOfStock
              ? "bg-red-600/90 text-white"
              : hasLowStock
              ? "bg-amber-500/90 text-white"
              : "bg-green-600/90 text-white"
          }`}
        >
          {isOutOfStock
            ? "Esgotado"
            : `${product.accumulativeProductOptionsCount} un.`}
        </div>
      </div>
      <div className="p-3 pb-4">
        <div className="text-sm mb-1 text-[#FF7622]">
          R$ {(product.value / 100).toFixed(2)}
        </div>
        <div className="text-sm line-clamp-1 text-[#2e2e2e] mb-1">
          {product.name}
        </div>
        {product.productOptionsCount > 0 && (
          <div className="text-xs text-gray-400 mb-3">
            {product.productOptionsCount}{" "}
            {product.productOptionsCount === 1 ? "sabor" : "sabores"}
          </div>
        )}
        <button
          onClick={onEdit}
          className="w-full bg-gray-50 hover:bg-gray-100 text-[#2e2e2e] py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors"
        >
          <Edit2 className="w-3 h-3" />
          Editar
        </button>
      </div>
    </div>
  );
}

export function MyStore({ store }: MyStoreProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(false);

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

  // Availability state
  const [weekDays, setWeekDays] = useState<WeekDay[]>([
    {
      weekday: 1,
      name: "Segunda",
      enabled: false,
      start: "08:00",
      end: "18:00",
    },
    { weekday: 2, name: "Terça", enabled: false, start: "08:00", end: "18:00" },
    {
      weekday: 3,
      name: "Quarta",
      enabled: false,
      start: "08:00",
      end: "18:00",
    },
    {
      weekday: 4,
      name: "Quinta",
      enabled: false,
      start: "08:00",
      end: "18:00",
    },
    { weekday: 5, name: "Sexta", enabled: false, start: "08:00", end: "18:00" },
    {
      weekday: 6,
      name: "Sábado",
      enabled: false,
      start: "08:00",
      end: "18:00",
    },
    {
      weekday: 0,
      name: "Domingo",
      enabled: false,
      start: "08:00",
      end: "18:00",
    },
  ]);

  // Fetch availabilities
  const { data: availabilities = [], isLoading: loadingAvailabilities } =
    useQuery({
      queryKey: ["store-availability", store.id],
      queryFn: () => storeAvailabilityService.getByStoreId(store.id),
      enabled: activeTab === "availability",
    });

  // Fetch products
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["store-products", store.id],
    queryFn: () => productService.getProductsWithCountsByStore(store.id),
    enabled: activeTab === "products",
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

  // Update availabilities mutation
  const updateAvailabilitiesMutation = useMutation({
    mutationFn: (availabilities: UpdateStoreAvailabilityUnit[]) =>
      storeAvailabilityService.updateAvailabilities({
        storeId: store.id,
        availabilities,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["store-availability", store.id],
      });
      toast.success("Disponibilidade atualizada!");
    },
    onError: () => {
      toast.error("Erro ao atualizar disponibilidade");
    },
  });

  // Update store status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: boolean) =>
      storeService.updateStore(store.id, {
        name: store.name,
        description: store.description,
        whatsapp: store.whatsapp,
        status,
      }),
    onMutate: async (newStatus) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["my-store"] });

      // Snapshot the previous value
      const previousStores = queryClient.getQueryData<Store[]>(["my-store"]);

      // Optimistically update to the new value
      if (previousStores) {
        queryClient.setQueryData<Store[]>(["my-store"], (old) =>
          old?.map((s) => (s.id === store.id ? { ...s, status: newStatus } : s))
        );
      }

      // Return context with the snapshotted value
      return { previousStores };
    },
    onSuccess: () => {
      toast.success(
        pendingStatus
          ? "Loja ativada com sucesso!"
          : "Loja desativada com sucesso!"
      );
      setShowStatusModal(false);
    },
    onError: (_error, _newStatus, context) => {
      // Rollback to the previous value
      if (context?.previousStores) {
        queryClient.setQueryData(["my-store"], context.previousStores);
      }
      toast.error("Erro ao atualizar status da loja");
      setShowStatusModal(false);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
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

  const handleWeekDayChange = (updatedDay: WeekDay) => {
    setWeekDays(
      weekDays.map((day) =>
        day.weekday === updatedDay.weekday ? updatedDay : day
      )
    );
  };

  const handleSaveAvailabilities = () => {
    const availabilitiesToSend = weekDays
      .filter((day) => day.enabled)
      .map((day) => ({
        weekday: day.weekday,
        start: day.start,
        end: day.end,
      }));

    updateAvailabilitiesMutation.mutate(availabilitiesToSend);
  };

  const handleStatusToggle = () => {
    setPendingStatus(!store.status);
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    updateStatusMutation.mutate(pendingStatus);
  };

  const handleEditProduct = (productId: string) => {
    navigate(`/produto/${productId}`, { state: { storeId: store.id } });
  };

  const handleCreateProduct = () => {
    navigate("/produto/novo", { state: { storeId: store.id } });
  };

  // Sync weekDays with availabilities when loaded
  useEffect(() => {
    if (availabilities.length > 0) {
      setWeekDays((current) =>
        current.map((day) => {
          const availability = availabilities.find(
            (a) => a.weekday === day.weekday
          );
          if (availability) {
            return {
              ...day,
              enabled: true,
              start: availability.start,
              end: availability.end,
            };
          }
          return day;
        })
      );
    }
  }, [availabilities]);

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
          <div className="space-y-6">
            {/* Store Status */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-[#2e2e2e] mb-3">Status da Loja</h3>
                  <div className="flex items-center gap-3">
                    <div
                      className={`relative size-12 rounded-2xl flex items-center justify-center transition-all ${
                        store.status ? "bg-green-50" : "bg-gray-100"
                      }`}
                    >
                      <div
                        className={`size-6 rounded-full transition-all ${
                          store.status ? "bg-green-500" : "bg-gray-400"
                        }`}
                      >
                        {store.status && (
                          <div className="size-6 rounded-full bg-green-500 animate-ping absolute"></div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div
                        className={`text-sm ${
                          store.status ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {store.status ? "Aberta" : "Fechada"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {store.status
                          ? "Aceitando pedidos"
                          : "Não aceitando pedidos"}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleStatusToggle}
                  className={`relative w-16 h-9 rounded-full transition-all shadow-inner ${
                    store.status ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-md transition-all duration-300 ${
                      store.status ? "right-1" : "left-1"
                    }`}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      {store.status ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Week Days */}
            {loadingAvailabilities ? (
              <div className="space-y-3">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl h-[60px] animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {weekDays.map((day) => (
                  <WeekDayRow
                    key={day.weekday}
                    day={day}
                    onChange={handleWeekDayChange}
                  />
                ))}
              </div>
            )}

            <button
              onClick={handleSaveAvailabilities}
              disabled={updateAvailabilitiesMutation.isPending}
              className="w-full bg-gradient-to-r from-[#FF7622] to-[#E6661A] text-white py-4 rounded-full uppercase transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
            >
              {updateAvailabilitiesMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </button>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-[#2e2e2e] mb-1">Total de Produtos</h3>
                <p className="text-3xl text-[#FF7622]">
                  {productsData?.total || 0}
                </p>
              </div>
              <Package className="w-12 h-12 text-gray-200" />
            </div>

            <button
              onClick={handleCreateProduct}
              className="w-full bg-gradient-to-r from-[#FF7622] to-[#E6661A] text-white py-4 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Adicionar Produto
            </button>

            {loadingProducts ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-3xl h-[220px] animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {productsData?.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={() => handleEditProduct(product.id)}
                  />
                ))}
              </div>
            )}

            {!loadingProducts && productsData?.total === 0 && (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400">Nenhum produto cadastrado</p>
                <p className="text-gray-300 text-sm mt-2">
                  Adicione seu primeiro produto
                </p>
              </div>
            )}
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

      {/* Status Change Confirmation Modal */}
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
    </div>
  );
}
