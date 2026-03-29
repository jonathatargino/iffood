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
      className="min-w-[170px] snap-start overflow-hidden rounded-3xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:shadow-xl active:scale-[0.98]"
    >
      <div className="relative h-[120px] w-full overflow-hidden">
        <img
          src={product.photoUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-2 right-2 rounded-full bg-[#FF7622] px-2.5 py-1 text-xs text-white shadow-md">
          {formatCentsToReaisWithSymbol(product.value)}
        </div>
      </div>
      <div className="p-4">
        <div className="mb-1 line-clamp-1 text-[#2e2e2e]">{product.name}</div>
        <div className="line-clamp-1 text-xs text-gray-400">
          {product.description}
        </div>
      </div>
    </button>
  );
}
