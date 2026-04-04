import { FormProvider, useForm } from "react-hook-form";
import { productFormSchema, type ProductFormData } from "../schema";
import { ImageDropzoneInput } from "./components/ImageDropzoneInput";
import { ProductFormInfoStep } from "./components/ProductFormInfoStep";
import { ProductFormOptionsStep } from "./components/ProductFormOptionsStep";
import { ProductFormActions } from "./components/ProductFormActions";
import type { Product } from "@/services/product";
import { formatPriceInput } from "@/utils/currency";
import { SectionHeader } from "@/components/SectionHeader";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

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
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description,
          price: formatPriceInput(String(product.value)),
          category: product.category as "sweet" | "savory",
          flavors: product.productOptions,
        }
      : {
          category: "savory",
          flavors: [
            {
              id: "temp-id",
              name: "",
              quantity: 0,
              status: "new",
            },
          ],
        },
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <SectionHeader
          title="Informações do produto"
          actions={
            isEditing && (
              <Button
                type="button"
                variant={"destructive"}
                size={"icon"}
                onClick={onDelete}
                disabled={isDeleteLoading}
              >
                <Trash2 />
              </Button>
            )
          }
        />

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

        <ProductFormActions isLoading={isLoading} />
      </form>
    </FormProvider>
  );
}
