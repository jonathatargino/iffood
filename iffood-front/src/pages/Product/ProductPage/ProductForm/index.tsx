import { FormProvider, useForm } from "react-hook-form";
import type { ProductFormData } from "../schema";
import { ImageDropzoneInput } from "./components/ImageDropzoneInput";
import { ProductFormInfoStep } from "./components/ProductFormInfoStep";
import { ProductFormOptionsStep } from "./components/ProductFormOptionsStep";
import { ProductFormActions } from "./components/ProductFormActions";
import type { Product } from "@/services/product";
import { formatPriceInput } from "@/utils/currency";
import { SectionHeader } from "@/components/SectionHeader";

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  isDeleteLoading: boolean;
  isLoading: boolean;
  isEditing: boolean;
  onDelete: () => void;
  product?: Product;
}

export function ProductForm({
  onSubmit,
  isDeleteLoading,
  isLoading,
  isEditing,
  product,
  onDelete,
}: ProductFormProps) {
  const form = useForm<ProductFormData>({
    defaultValues: product
      ? {
          name: product.name,
          description: product.description,
          price: formatPriceInput(String(product.value)),
          category: product.category as "sweet" | "savory",
          flavors: product.productOptions,
        }
      : { flavors: [] },
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <SectionHeader title="Informações do produto" />

        <div className="flex flex-col gap-4 px-6">
          <ImageDropzoneInput
            name="image"
            control={form.control}
            label="Imagem do Produto"
            previewUrl={product?.photoUrl}
          />
          <ProductFormInfoStep />
        </div>

        <ProductFormOptionsStep />

        <ProductFormActions
          isDeleteLoading={isDeleteLoading}
          isEditing={isEditing}
          isLoading={isLoading}
          setShowDeleteModal={onDelete}
        />
      </form>
    </FormProvider>
  );
}
