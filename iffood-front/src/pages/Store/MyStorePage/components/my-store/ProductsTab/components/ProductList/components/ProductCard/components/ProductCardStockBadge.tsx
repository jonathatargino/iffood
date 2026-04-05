import { cn } from "@/lib/utils";

interface ProductCardStockBadgeProps {
  accumulativeCount: number;
}

export function ProductCardStockBadge({
  accumulativeCount,
}: ProductCardStockBadgeProps) {
  const hasLowStock = accumulativeCount > 0 && accumulativeCount <= 5;
  const isOutOfStock = accumulativeCount === 0;

  return (
    <div
      className={cn([
        "absolute top-2 right-2 rounded-lg bg-white px-2 py-1 text-xs backdrop-blur-md",
        { "text-red-600": isOutOfStock },
        { "text-amber-600": hasLowStock },
        { "text-green-600": !isOutOfStock && !hasLowStock },
      ])}
    >
      {isOutOfStock ? "Esgotado" : `${accumulativeCount} un.`}
    </div>
  );
}
