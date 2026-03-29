import { useNavigate } from "react-router";
import { ProductCard } from "./components/ProductCard";
import type { Product } from "@/services/product";

interface ProductCarouselProps {
  products: Product[];
}

export function ProductCarousel({ products }: ProductCarouselProps) {
  const navigate = useNavigate();

  const handleProductClick = (id: string) => {
    navigate(`/produto/detalhes/${id}`);
  };

  return (
    <div className="scrollbar-hide overflow-x-auto">
      <div className="flex snap-x snap-mandatory gap-4 px-6 pb-2">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => handleProductClick(product.id)}
          />
        ))}
      </div>
    </div>
  );
}
