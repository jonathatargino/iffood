import { ProductCard } from "./components/ProductCard";
import type { ProductWithCounts } from "@/services/product";
import { CenteredBouncingDots } from "@/components/CenteredBouncingDots";

type ProductsListProps = {
  products: ProductWithCounts[];
  isLoading: boolean;
  onEditProduct: (productId: string) => void;
};

export function ProductsList({
  products,
  isLoading,
  onEditProduct,
}: ProductsListProps) {
  return (
    <div className="flex min-h-60 flex-col space-y-6">
      {isLoading && <CenteredBouncingDots />}

      {!isLoading && (
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => onEditProduct(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
