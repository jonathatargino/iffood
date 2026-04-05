import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { LoadingView } from "@/views/LoadingView";
import { PageHeader } from "@/components/PageHeader";
import { type ProductFormData } from "./schema";
import { ProductForm } from "./ProductForm";
import { useDeleteProduct } from "./hooks/useDeleteProduct";
import { useUpdateProduct } from "./hooks/useUpdateProduct";
import { useCreateProduct } from "./hooks/useCreateProduct";
import { useGetProductById } from "./hooks/useGetProductById";
import { toCreateProductData, toUpdateProductData } from "./utils";
import { NotFoundPage } from "@/pages/NotFoundPage";

type ProductFormProps = {
  storeId: string;
  isEditing: boolean;
};

export function ProductFormPage({ storeId, isEditing }: ProductFormProps) {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: product, isLoading: loadingProduct } = useGetProductById({
    id: productId!,
    enabled: isEditing && !!productId,
  });

  const createProductMutation = useCreateProduct({
    storeId,
    onSuccess: () => {
      toast.success("Produto criado com sucesso!");
      navigate("/loja/minha-loja");
    },
    onError: () => {
      toast.error("Erro ao criar produto");
    },
  });

  const updateProductMutation = useUpdateProduct({
    storeId,
    productId: productId!,
    onSuccess: () => {
      toast.success("Produto atualizado com sucesso!");
      navigate("/loja/minha-loja");
    },
    onError: () => {
      toast.error("Erro ao atualizar produto");
    },
  });

  const deleteProductMutation = useDeleteProduct({
    storeId,
    onSuccess: () => {
      setShowDeleteModal(false);
      toast.success("Produto deletado com sucesso!");
      navigate("/loja/minha-loja");
    },
    onError: () => {
      toast.error("Erro ao deletar produto");
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (!data.image && !isEditing) {
      toast.error("Adicione uma imagem do produto");
      return;
    }

    if (isEditing) {
      return updateProductMutation.mutate(
        toUpdateProductData(productId!, data),
      );
    }

    return createProductMutation.mutate(toCreateProductData(storeId, data));
  };

  const handleDelete = () => {
    deleteProductMutation.mutate({ id: productId! });
  };

  if (loadingProduct && isEditing) {
    return <LoadingView />;
  }

  if (isEditing && (!productId || (loadingProduct && !product))) {
    return <NotFoundPage />;
  }

  const pageHeaderText = isEditing ? "Editar Produto" : "Novo Produto";

  return (
    <div className="min-h-screen bg-white pb-8">
      <PageHeader text={pageHeaderText} hasBackButton />

      <ProductForm
        onSubmit={onSubmit}
        isDeleteLoading={deleteProductMutation.isPending}
        isLoading={
          updateProductMutation.isPending || createProductMutation.isPending
        }
        isEditing={isEditing}
        product={product}
        onDelete={() => setShowDeleteModal(true)}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Deletar Produto"
        variant="danger"
        message="Tem certeza que deseja deletar este produto? Esta ação não pode ser desfeita."
        confirmText="Deletar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        isLoading={deleteProductMutation.isPending}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
