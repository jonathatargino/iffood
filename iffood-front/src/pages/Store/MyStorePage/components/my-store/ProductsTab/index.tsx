import { useNavigate } from "react-router";
import { useStoreProducts } from "../../../hooks/useStoreQueries";
import { ProductsList } from "./components/ProductList";
import { SectionHeader } from "@/components/SectionHeader";
import { getProductsTabSectionDescription } from "./utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/Button";

type ProductsTabProps = {
  storeId: string;
};

export function ProductsTab({ storeId }: ProductsTabProps) {
  const navigate = useNavigate();

  const { data: productsData, isLoading } = useStoreProducts(storeId, true);

  const handleEditProduct = (productId: string) => {
    navigate(`/produto/${productId}`, { state: { storeId } });
  };

  const handleCreateProduct = () => {
    navigate("/produto/novo", { state: { storeId } });
  };

  const products = productsData?.products || [];
  const totalProduts = productsData?.total || 0;
  const sectionDescription = isLoading
    ? undefined
    : getProductsTabSectionDescription(totalProduts);

  return (
    <>
      <SectionHeader
        title="Meus produtos"
        description={sectionDescription}
        actions={
          <Button onClick={handleCreateProduct} size={"icon"}>
            <Plus />
          </Button>
        }
      />
      <div className="mt-4 px-6">
        <ProductsList
          products={products}
          isLoading={isLoading}
          onEditProduct={handleEditProduct}
        />
      </div>
    </>
  );
}
