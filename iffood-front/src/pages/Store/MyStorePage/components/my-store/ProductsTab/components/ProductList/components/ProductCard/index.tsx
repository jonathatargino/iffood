import type { ProductWithCounts } from "@/services/product";
import { ProductCardStockBadge } from "./components/ProductCardStockBadge";
import { ProductCardInfo } from "./components/ProductCardInfo";

type ProductCardProps = {
  product: ProductWithCounts;
  onEdit: () => void;
};

export function ProductCard({ product, onEdit }: ProductCardProps) {
  return (
    <div
      onClick={onEdit}
      className="overflow-hidden rounded-3xl border border-gray-100 bg-white transition-all"
    >
      <div className="relative h-[110px] w-full overflow-hidden">
        <img
          src={product.photoUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        <ProductCardStockBadge
          accumulativeCount={product.accumulativeProductOptionsCount}
        />
      </div>
      <ProductCardInfo product={product} />
    </div>
  );
}
