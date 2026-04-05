import { formatCentsToReaisWithSymbol } from "@/utils/currency";
import { getProductCardInfoCountLabel } from "./utils";
import type { ProductWithCounts } from "@/services/product";

interface ProductCardInfoProps {
  product: ProductWithCounts;
}

export function ProductCardInfo({ product }: ProductCardInfoProps) {
  const countLabel = getProductCardInfoCountLabel(product.productOptionsCount);

  return (
    <div className="p-3 pb-4">
      <div className="mb-1 line-clamp-1 text-sm text-[#2e2e2e]">
        {product.name}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">{countLabel}</div>
        <div className="text-xs text-[#FF7622]">
          {formatCentsToReaisWithSymbol(product.value)}
        </div>
      </div>
    </div>
  );
}
