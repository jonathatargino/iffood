import { useNavigate } from "react-router";
import { useStoreProducts } from "../../../hooks/use-store-queries";
import { ProductsList } from "./components/ProductList";
import { SectionHeader } from "@/components/SectionHeader";
import { getProductsTabSectionDescription } from "./utils";
import { Plus } from "lucide-react";

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
          <button
            onClick={handleCreateProduct}
            className="mr-3 h-fit w-fit rounded-full bg-gradient-to-r from-[#FF7622] to-[#E6661A] p-1 text-white transition-all hover:shadow-xl active:scale-[0.98]"
          >
            <Plus className="size-6 text-white" />
          </button>
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
