import type { Product } from "@/services/product";
import { formatCentsToReaisWithSymbol } from "@/utils/currency";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-[170px] snap-start overflow-hidden rounded-3xl border border-gray-100 bg-white text-left transition-all active:scale-[0.98]"
    >
      <div className="relative h-[120px] w-full overflow-hidden">
        <img
          src={product.photoUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-2 right-2 rounded-full bg-white px-2.5 py-1 text-xs text-green-600">
          {formatCentsToReaisWithSymbol(product.value)}
        </div>
      </div>
      <div className="p-4">
        <div className="mb-1 line-clamp-1 text-[#2e2e2e]">{product.name}</div>
        <div className="line-clamp-1 text-xs text-gray-400">
          {product.store?.name}
        </div>
      </div>
    </button>
  );
}
