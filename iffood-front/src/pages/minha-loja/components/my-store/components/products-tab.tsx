import { useNavigate } from "react-router";
import { useStoreProducts } from "../../../hooks/use-store-queries";
import { ProductsList } from "./products-list";

type ProductsTabProps = {
  storeId: string;
};

export function ProductsTab({ storeId }: ProductsTabProps) {
  const navigate = useNavigate();

  const { data: productsData, isLoading: loadingProducts } = useStoreProducts(
    storeId,
    true
  );

  const handleEditProduct = (productId: string) => {
    navigate(`/produto/${productId}`, { state: { storeId } });
  };

  const handleCreateProduct = () => {
    navigate("/produto/novo", { state: { storeId } });
  };

  return (
    <ProductsList
      products={productsData?.products || []}
      totalProducts={productsData?.total || 0}
      isLoading={loadingProducts}
      onEditProduct={handleEditProduct}
      onCreateProduct={handleCreateProduct}
    />
  );
}
