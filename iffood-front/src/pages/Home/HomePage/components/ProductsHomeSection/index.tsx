import type { Product } from "@/services/product";
import { ProductCarousel } from "./components/ProductCarousel";
import { useNavigate } from "react-router";
import { HomeSectionHeader } from "../HomeSectionHeader";

interface ProductsHomeSectionProps {
  products: Product[];
}

export function ProductsHomeSection({ products }: ProductsHomeSectionProps) {
  const navigate = useNavigate();

  const handleViewAllProducts = () => {
    navigate("/busca?type=products");
  };

  return (
    <div className="mt-2 mb-2">
      <HomeSectionHeader
        title="Produtos em destaque"
        onViewAll={handleViewAllProducts}
      />

      <ProductCarousel products={products} />
    </div>
  );
}
