import { Edit2 } from "lucide-react";
import type { ProductWithCounts } from "@/services/product";
import { formatCentsToReaisWithSymbol } from "@/utils/currency";

type ProductCardProps = {
  product: ProductWithCounts;
  onEdit: () => void;
};

export function ProductCard({ product, onEdit }: ProductCardProps) {
  const hasLowStock =
    product.accumulativeProductOptionsCount > 0 &&
    product.accumulativeProductOptionsCount <= 5;
  const isOutOfStock = product.accumulativeProductOptionsCount === 0;

  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden border border-gray-100">
      <div className="relative h-[110px] w-full overflow-hidden">
        <img
          src={product.photoUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div
          className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs backdrop-blur-md ${
            isOutOfStock
              ? "bg-red-600/90 text-white"
              : hasLowStock
              ? "bg-amber-500/90 text-white"
              : "bg-green-600/90 text-white"
          }`}
        >
          {isOutOfStock
            ? "Esgotado"
            : `${product.accumulativeProductOptionsCount} un.`}
        </div>
      </div>
      <div className="p-3 pb-4">
        <div className="text-sm mb-1 text-[#FF7622]">
          {formatCentsToReaisWithSymbol(product.value)}
        </div>
        <div className="text-sm line-clamp-1 text-[#2e2e2e] mb-1">
          {product.name}
        </div>
        {product.productOptionsCount > 0 && (
          <div className="text-xs text-gray-400 mb-3">
            {product.productOptionsCount}{" "}
            {product.productOptionsCount === 1 ? "sabor" : "sabores"}
          </div>
        )}
        <button
          onClick={onEdit}
          className="w-full bg-gray-50 hover:bg-gray-100 text-[#2e2e2e] py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors"
        >
          <Edit2 className="w-3 h-3" />
          Editar
        </button>
      </div>
    </div>
  );
}
