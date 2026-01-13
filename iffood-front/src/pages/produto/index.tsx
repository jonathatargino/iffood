import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, X, Trash2, Plus, Minus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { productService } from "@/services/product";
import { ConfirmationModal } from "@/components/confirmation-modal";

type ProductFormProps = {
  storeId: string;
};

type Flavor = {
  id?: string;
  name: string;
  quantity: number;
  status?: "new" | "updated" | "deleted";
};

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

function FlavorCard({
  flavor,
  canDelete,
  onUpdate,
  onDelete,
}: {
  flavor: Flavor;
  canDelete: boolean;
  onUpdate: (flavor: Flavor) => void;
  onDelete: () => void;
}) {
  const decreaseStock = () => {
    if (flavor.quantity > 0) {
      onUpdate({ ...flavor, quantity: flavor.quantity - 1 });
    }
  };

  const increaseStock = () => {
    onUpdate({ ...flavor, quantity: flavor.quantity + 1 });
  };

  const handleNameChange = (name: string) => {
    onUpdate({ ...flavor, name });
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 mr-2">
          <label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider">
            Sabor
          </label>
          <input
            type="text"
            value={flavor.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ex: Chocolate, Morango..."
            className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-[#FF7622] transition-colors text-sm bg-white"
          />
        </div>
        {canDelete && (
          <button
            onClick={onDelete}
            className="size-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors mt-6 shrink-0"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-200">
        <div>
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
            Estoque
          </div>
          <div className="text-2xl text-[#2e2e2e]">{flavor.quantity}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={decreaseStock}
            disabled={flavor.quantity <= 0}
            className={`size-9 rounded-lg flex items-center justify-center transition-all ${
              flavor.quantity <= 0
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-[#FF7622] text-white hover:bg-[#E6661A] active:scale-95"
            }`}
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={increaseStock}
            className="size-9 bg-[#FF7622] text-white rounded-lg flex items-center justify-center hover:bg-[#E6661A] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductForm({ storeId }: ProductFormProps) {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const queryClient = useQueryClient();
  const isEditMode = productId !== "novo";

  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState<"sweet" | "savory">(
    "savory"
  );
  const [productImage, setProductImage] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [flavors, setFlavors] = useState<Flavor[]>([
    { name: "", quantity: 0, status: "new" },
  ]);

  // Fetch product data if editing
  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productService.getProductById(productId!),
    enabled: isEditMode,
  });

  // Load product data into form
  useEffect(() => {
    if (product && isEditMode) {
      setProductName(product.name);
      setProductDescription(product.description);
      setProductPrice((product.value / 100).toFixed(2));
      setProductCategory(product.category as "sweet" | "savory");
      setProductImage(product.photoUrl);

      if (product.productOptions && product.productOptions.length > 0) {
        setFlavors(
          product.productOptions.map((opt) => ({
            id: opt.id,
            name: opt.name,
            quantity: opt.quantity,
            status: "updated" as const,
          }))
        );
      } else {
        setFlavors([{ name: "", quantity: 0, status: "new" }]);
      }
    }
  }, [product, isEditMode]);

  const categories = [
    { id: "savory", name: "Salgado" },
    { id: "sweet", name: "Doce" },
  ];

  const totalStock = flavors
    .filter((f) => f.status !== "deleted")
    .reduce((sum, flavor) => sum + flavor.quantity, 0);
  const canAddFlavor =
    flavors.filter((f) => f.status !== "deleted").length < 10;
  const canDeleteFlavor =
    flavors.filter((f) => f.status !== "deleted").length > 1;

  const addFlavor = () => {
    if (canAddFlavor) {
      const newFlavor: Flavor = {
        name: "",
        quantity: 0,
        status: "new",
      };
      setFlavors([...flavors, newFlavor]);
    }
  };

  const updateFlavor = (index: number, updatedFlavor: Flavor) => {
    const newFlavors = [...flavors];
    newFlavors[index] = {
      ...updatedFlavor,
      status: updatedFlavor.id ? "updated" : "new",
    };
    setFlavors(newFlavors);
  };

  const deleteFlavor = (index: number) => {
    if (!canDeleteFlavor) return;

    const newFlavors = [...flavors];
    if (newFlavors[index].id) {
      // Mark as deleted if it has an ID (exists in DB)
      newFlavors[index] = { ...newFlavors[index], status: "deleted" };
    } else {
      // Remove completely if it's new
      newFlavors.splice(index, 1);
    }
    setFlavors(newFlavors);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createProductMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      value: number;
      category: "sweet" | "savory";
      storeId: string;
      photo: File;
      productOptions: { name: string; quantity: number }[];
    }) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-products", storeId] });
      toast.success("Produto criado com sucesso!");
      navigate("/minha-loja");
    },
    onError: () => {
      toast.error("Erro ao criar produto");
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: (data: {
      id: string;
      name: string;
      description: string;
      value: number;
      category: "sweet" | "savory";
      photo?: File;
      productOptions: {
        id?: string;
        name: string;
        quantity: number;
        status: "new" | "updated" | "deleted";
      }[];
    }) => productService.updateProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-products", storeId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      toast.success("Produto atualizado com sucesso!");
      navigate("/minha-loja");
    },
    onError: () => {
      toast.error("Erro ao atualizar produto");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-products", storeId] });
      toast.success("Produto deletado com sucesso!");
      navigate("/minha-loja");
    },
    onError: () => {
      toast.error("Erro ao deletar produto");
    },
  });

  const handleSave = () => {
    if (!imageFile && !isEditMode) {
      toast.error("Adicione uma imagem do produto");
      return;
    }

    const priceInCents = Math.round(parseFloat(productPrice) * 100);

    const activeFlavors = flavors.filter((f) => f.status !== "deleted");

    if (isEditMode) {
      updateProductMutation.mutate({
        id: productId!,
        name: productName,
        description: productDescription,
        value: priceInCents,
        category: productCategory,
        photo: imageFile || undefined,
        productOptions: flavors.map((f) => ({
          id: f.id,
          name: f.name,
          quantity: f.quantity,
          status: f.status || "updated",
        })),
      });
    } else {
      createProductMutation.mutate({
        name: productName,
        description: productDescription,
        value: priceInCents,
        category: productCategory,
        storeId,
        photo: imageFile!,
        productOptions: activeFlavors.map((f) => ({
          name: f.name,
          quantity: f.quantity,
        })),
      });
    }
  };

  const handleDelete = () => {
    deleteProductMutation.mutate(productId!);
    setShowDeleteModal(false);
  };

  const hasEmptyFlavors = flavors
    .filter((f) => f.status !== "deleted")
    .some((f) => !f.name.trim());

  const isSaveDisabled =
    hasEmptyFlavors ||
    !productName ||
    !productPrice ||
    (!imageFile && !isEditMode) ||
    createProductMutation.isPending ||
    updateProductMutation.isPending;

  if (loadingProduct && isEditMode) {
    return (
      <div className="bg-[#fafafa] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-[#FF7622] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fafafa] min-h-screen pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#FF7622] to-[#E6661A] px-6 pt-14 pb-8 rounded-b-[32px] shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <BackButton onClick={() => navigate("/minha-loja")} />
          <h1 className="text-white text-lg">
            {isEditMode ? "Editar Produto" : "Novo Produto"}
          </h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Image Upload */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <label className="text-xs text-gray-400 mb-3 block uppercase tracking-wider">
            Imagem do Produto
          </label>
          <div className="relative aspect-video bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-[#FF7622] transition-colors">
            {productImage ? (
              <>
                <img
                  src={productImage}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => {
                    setProductImage("");
                    setImageFile(null);
                  }}
                  className="absolute top-3 right-3 size-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                <Upload className="w-10 h-10 text-gray-300 mb-2" />
                <span className="text-sm text-gray-400">
                  Clique para fazer upload
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
              Nome do Produto
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: Pizza Margherita"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:border-[#FF7622] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
              Descrição
            </label>
            <textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="Descreva seu produto..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:border-[#FF7622] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
              Preço (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:border-[#FF7622] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
              Categoria
            </label>
            <select
              value={productCategory}
              onChange={(e) =>
                setProductCategory(e.target.value as "sweet" | "savory")
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:border-[#FF7622] transition-colors bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Total Stock Display */}
        <div className="bg-gradient-to-r from-[#FF7622] to-[#E6661A] rounded-3xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90 mb-1">Estoque Total</div>
              <div className="text-4xl">{totalStock}</div>
              <div className="text-sm opacity-90 mt-1">
                unidades disponíveis
              </div>
            </div>
            <div className="size-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
                <path
                  d="M20 7h-4m0 10v-5m0 0V7m0 5h5m-5 0H8m12-6.74V17a2 2 0 01-2 2H6a2 2 0 01-2-2V4.26A1 1 0 014.74 3H6a2 2 0 012 2v1h8V5a2 2 0 012-2h1.26a1 1 0 01.74 1.26z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Flavors Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[#2e2e2e] mb-1">Sabores</h3>
              <p className="text-xs text-gray-400">
                {flavors.filter((f) => f.status !== "deleted").length}/10
                sabores • Estoque por sabor
              </p>
            </div>
            <button
              onClick={addFlavor}
              disabled={!canAddFlavor}
              className={`px-4 py-2 rounded-full flex items-center gap-2 transition-all text-sm ${
                canAddFlavor
                  ? "bg-[#FF7622] text-white hover:bg-[#E6661A] active:scale-95"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>

          {!canAddFlavor && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Limite máximo de 10 sabores atingido.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {flavors
              .map((flavor, index) => ({ flavor, index }))
              .filter(({ flavor }) => flavor.status !== "deleted")
              .map(({ flavor, index }) => (
                <FlavorCard
                  key={index}
                  flavor={flavor}
                  canDelete={canDeleteFlavor}
                  onUpdate={(updated) => updateFlavor(index, updated)}
                  onDelete={() => deleteFlavor(index)}
                />
              ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className="w-full bg-gradient-to-r from-[#FF7622] to-[#E6661A] text-white py-4 rounded-full uppercase transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createProductMutation.isPending || updateProductMutation.isPending
              ? "Salvando..."
              : isEditMode
              ? "Salvar Alterações"
              : "Criar Produto"}
          </button>

          {isEditMode && (
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={deleteProductMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-full uppercase transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
              {deleteProductMutation.isPending
                ? "Deletando..."
                : "Deletar Produto"}
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Deletar Produto"
        message="Tem certeza que deseja deletar este produto? Esta ação não pode ser desfeita."
        confirmText="Deletar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        variant="danger"
        isLoading={deleteProductMutation.isPending}
      />
    </div>
  );
}
