import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, X, Trash2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { productService } from "@/services/product";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { PRODUCT_CATEGORIES, MAX_FLAVORS } from "./utils";
import {
  formatPriceInput,
  parsePriceInputToCents,
  formatCentsToReais,
} from "@/utils/currency";
import {
  MAX_FILE_SIZE,
  MAX_HEIGHT,
  MAX_WIDTH,
  MIN_HEIGHT,
  MIN_WIDTH,
} from "@/components/utils";

type ProductFormProps = {
  storeId: string;
};

const flavorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome do sabor é obrigatório"),
  quantity: z.number().min(0, "Quantidade não pode ser negativa"),
  status: z.enum(["new", "updated", "deleted"]).optional(),
});

const productFormSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  price: z.string().min(1, "Preço é obrigatório"),
  category: z.enum(["sweet", "savory"]),
  image: z.file().optional(),
  flavors: z
    .array(flavorSchema)
    .min(1, "Adicione pelo menos um sabor")
    .max(MAX_FLAVORS, `Máximo de ${MAX_FLAVORS} sabores`),
});

type ProductFormData = z.infer<typeof productFormSchema>;

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
  index,
  canDelete,
  register,
  errors,
  quantity,
  onDecrease,
  onIncrease,
  onDelete,
}: {
  index: number;
  canDelete: boolean;
  register: any;
  errors: any;
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onDelete: () => void;
}) {
  const error = errors?.flavors?.[index];

  return (
    <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 mr-2">
          <label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider">
            Sabor
          </label>
          <input
            type="text"
            {...register(`flavors.${index}.name`)}
            placeholder="Ex: Chocolate, Morango..."
            className={`w-full px-3 py-2 border rounded-xl outline-none focus:border-[#FF7622] transition-colors text-sm bg-white ${
              error?.name ? "border-red-500" : "border-gray-300"
            }`}
          />
          {error?.name && (
            <p className="text-xs text-red-500 mt-1">{error.name.message}</p>
          )}
        </div>
        {canDelete && (
          <button
            type="button"
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
          <div className="text-2xl text-[#2e2e2e]">{quantity}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDecrease}
            disabled={quantity <= 0}
            className={`size-9 rounded-lg flex items-center justify-center transition-all ${
              quantity <= 0
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-[#FF7622] text-white hover:bg-[#E6661A] active:scale-95"
            }`}
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onIncrease}
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
  const [preview, setPreview] = useState<string>();
  const queryClient = useQueryClient();
  const isEditMode = productId !== "novo";

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "savory",
      image: undefined,
      flavors: [{ name: "", quantity: 0, status: "new" }],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "flavors",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const flavorsData = watch("flavors");

  // Fetch product data if editing
  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productService.getProductById(productId!),
    enabled: isEditMode,
  });

  // Load product data into form
  useEffect(() => {
    if (product && isEditMode) {
      setValue("name", product.name);
      setValue("description", product.description);
      setValue("price", formatCentsToReais(product.value));
      setValue("category", product.category as "sweet" | "savory");
      setPreview(product.photoUrl);

      if (product.productOptions && product.productOptions.length > 0) {
        setValue(
          "flavors",
          product.productOptions.map((opt) => ({
            id: opt.id,
            name: opt.name,
            quantity: opt.quantity,
            status: "updated" as const,
          })),
        );
      }
    }
  }, [product, isEditMode, setValue]);

  const totalStock = flavorsData
    .filter((f) => f.status !== "deleted")
    .reduce((sum, flavor) => sum + flavor.quantity, 0);
  const activeFlavors = fields.filter(
    (_, index) => flavorsData[index]?.status !== "deleted",
  );
  const canAddFlavor = activeFlavors.length < MAX_FLAVORS;
  const canDeleteFlavor = activeFlavors.length > 1;

  const addFlavor = () => {
    if (canAddFlavor) {
      append({ name: "", quantity: 0, status: "new" });
    }
  };

  const updateFlavorQuantity = (index: number, newQuantity: number) => {
    const currentFlavor = flavorsData[index];
    update(index, {
      ...currentFlavor,
      quantity: newQuantity,
      status: currentFlavor.id ? "updated" : "new",
    });
  };

  const deleteFlavor = (index: number) => {
    if (!canDeleteFlavor) return;

    const currentFlavor = flavorsData[index];
    if (currentFlavor.id) {
      update(index, { ...currentFlavor, status: "deleted" });
    } else {
      remove(index);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande", {
        description: "A imagem deve ter no máximo 5MB.",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo inválido", {
        description: "Apenas imagens são permitidas.",
      });
      return;
    }

    const img = new Image();
    const imageUrl = URL.createObjectURL(file);
    img.src = imageUrl;

    img.onload = async () => {
      const { width, height } = img;
      if (width < MIN_WIDTH || height < MIN_HEIGHT) {
        toast.error("Resolução muito baixa", {
          description: "A imagem deve ter no mínimo 800x600 pixels.",
        });
        URL.revokeObjectURL(imageUrl);
        return;
      }

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        toast.error("Resolução muito alta", {
          description: "A imagem deve ter no máximo 5000x5000 pixels.",
        });
        URL.revokeObjectURL(imageUrl);
        return;
      }

      setPreview(imageUrl);
      setValue("image", file);
      toast.success("Imagem selecionada", {
        description: "Clique em salvar para atualizar a foto.",
      });
    };

    img.onerror = () => {
      toast.error("Erro ao carregar imagem", {
        description: "O arquivo selecionado não é uma imagem válida.",
      });
      URL.revokeObjectURL(imageUrl);
    };
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
        updated: { id: string; name: string; quantity: number }[];
        deleted: { id: string; name: string; quantity: number }[];
        new: { name: string; quantity: number }[];
      };
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

  const onSubmit = (data: ProductFormData) => {
    if (!data.image && !isEditMode) {
      toast.error("Adicione uma imagem do produto");
      return;
    }

    const priceInCents = parsePriceInputToCents(data.price);

    const activeFlavors = data.flavors.filter((f) => f.status !== "deleted");

    if (isEditMode) {
      const updatedFlavors = data.flavors
        .filter((f) => f.status === "updated" && f.id)
        .map((f) => ({
          id: f.id!,
          name: f.name,
          quantity: f.quantity,
        }));

      const deletedFlavors = data.flavors
        .filter((f) => f.status === "deleted" && f.id)
        .map((f) => ({
          id: f.id!,
          name: f.name,
          quantity: f.quantity,
        }));

      const newFlavors = data.flavors
        .filter((f) => f.status === "new")
        .map((f) => ({
          name: f.name,
          quantity: f.quantity,
        }));

      updateProductMutation.mutate({
        id: productId!,
        name: data.name,
        description: data.description,
        value: priceInCents,
        category: data.category,
        photo: data.image || undefined,
        productOptions: {
          updated: updatedFlavors,
          deleted: deletedFlavors,
          new: newFlavors,
        },
      });
    } else {
      createProductMutation.mutate({
        name: data.name,
        description: data.description,
        value: priceInCents,
        category: data.category,
        storeId,
        photo: data.image!,
        productOptions: activeFlavors.map((f) => ({
          name: f.name,
          quantity: f.quantity,
        })),
      });
    }
  };

  const buttonsDisabled =
    updateProductMutation.isPending ||
    createProductMutation.isPending ||
    deleteProductMutation.isPending;

  const handleDelete = () => {
    deleteProductMutation.mutate(productId!);
    setShowDeleteModal(false);
  };

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

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
        {/* Image Upload */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <label className="text-xs text-gray-400 mb-3 block uppercase tracking-wider">
            Imagem do Produto
          </label>
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-[#FF7622] transition-colors">
            {preview ? (
              <>
                <img
                  src={preview}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setValue("image", undefined);
                    setPreview(undefined);
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
                  onChange={handleFileChange}
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
              Nome do Produto*
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="Ex: Pizza Margherita"
              className={`w-full px-4 py-3 border rounded-2xl outline-none focus:border-[#FF7622] transition-colors ${
                errors.name ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
              Descrição*
            </label>
            <textarea
              {...register("description")}
              placeholder="Descreva seu produto..."
              rows={3}
              className={`w-full px-4 py-3 border rounded-2xl outline-none focus:border-[#FF7622] transition-colors resize-none ${
                errors.description ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
              Preço (R$)*
            </label>
            <input
              type="text"
              {...register("price")}
              onChange={(e) => {
                const formatted = formatPriceInput(e.target.value);
                setValue("price", formatted);
              }}
              placeholder="0,00"
              className={`w-full px-4 py-3 border rounded-2xl outline-none focus:border-[#FF7622] transition-colors ${
                errors.price ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.price && (
              <p className="text-xs text-red-500 mt-1">
                {errors.price.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
              Categoria*
            </label>
            <select
              {...register("category")}
              className={`w-full px-4 py-3 border rounded-2xl outline-none focus:border-[#FF7622] transition-colors bg-white ${
                errors.category ? "border-red-500" : "border-gray-200"
              }`}
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-red-500 mt-1">
                {errors.category.message}
              </p>
            )}
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
            <label className="text-xs text-gray-400 uppercase tracking-wider">
              Sabores
            </label>
            {flavorsData.length < 10 && (
              <button
                type="button"
                onClick={addFlavor}
                className="flex items-center gap-1.5 text-[#FF7622] text-sm hover:bg-orange-50 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            )}
          </div>

          <div className="space-y-3">
            {flavorsData.map((flavor, index) => (
              <>
                {flavor.status !== "deleted" && (
                  <FlavorCard
                    key={flavor.id}
                    index={index}
                    canDelete={flavorsData.length > 1}
                    register={register}
                    errors={errors}
                    quantity={flavor.quantity}
                    onDecrease={() =>
                      updateFlavorQuantity(index, flavor.quantity - 1)
                    }
                    onIncrease={() =>
                      updateFlavorQuantity(index, flavor.quantity + 1)
                    }
                    onDelete={() => deleteFlavor(index)}
                  />
                )}
              </>
            ))}
          </div>
          {errors.flavors && (
            <p className="text-xs text-red-500 mt-2">
              {errors.flavors.message}
            </p>
          )}
        </div>

        {/* Actions */}
        {isEditMode && (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={buttonsDisabled}
            className="py-4 px-4 w-full rounded-2xl bg-red-600 text-white hover:bg-red-700 active:scale-95 transition transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteProductMutation.isPending ? "Deletando..." : "Deletar"}
          </button>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            disabled={buttonsDisabled}
            onClick={() => navigate("/minha-loja")}
            className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={buttonsDisabled}
            className="flex-1 py-4 bg-gradient-to-br from-[#FF7622] to-[#E6661A] text-white rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateProductMutation.isPending || createProductMutation.isPending
              ? "Salvando..."
              : "Salvar Produto"}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {isEditMode && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          title="Deletar Produto"
          message="Tem certeza que deseja deletar este produto? Esta ação não pode ser desfeita."
          confirmText="Deletar"
          cancelText="Cancelar"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
