import type { Product } from "@/services/product";
import { NoAvailableProductsView } from "./components/NoProductsView";
import { useNavigate } from "react-router";
import { ProductCard } from "@/components/ProductCard";

interface StoreProductListProps {
  products: Product[];
}

export function StoreProductList({ products }: StoreProductListProps) {
  const navigate = useNavigate();

  if (products.length === 0) {
    return <NoAvailableProductsView />;
  }

  return (
    <div className="mb-8 grid grid-cols-2 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={() => navigate(`/produto/detalhes/${product.id}`)}
          ommitedStoreName
          className="max-w-36"
        />
      ))}
    </div>
  );
}
