import { OutlinedCard } from "@/components/OutlinedCard";
import type { Product } from "@/services/product";
import { formatCentsToReaisWithSymbol } from "@/utils/currency";

interface ProductResultCardProps {
  product: Product;
  onClick?: () => void;
}

export function ProductResultCard({
  product,
  onClick,
}: ProductResultCardProps) {
  return (
    <OutlinedCard
      onClick={onClick}
      className="mb-3 w-full overflow-hidden text-left transition-all active:scale-[0.98]"
    >
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl shadow-md">
          <img
            src={product.photoUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1 text-left">
          <div className="mb-1 text-sm text-[#2e2e2e]">{product.name}</div>
          <div className="mb-2 line-clamp-1 text-xs text-gray-400">
            {product.description}
          </div>
          <div className="text-[#FF7622]">
            {formatCentsToReaisWithSymbol(product.value)}
          </div>
        </div>
      </div>
    </OutlinedCard>
  );
}
