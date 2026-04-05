import type { Store } from "@/services/store";
import { Star } from "lucide-react";

interface StoreResultCardProps {
  store: Store;
  onClick: () => void;
}

export function StoreResultCard({ store, onClick }: StoreResultCardProps) {
  const rating = store.rating ? store.rating.toFixed(1) : null;

  return (
    <button
      onClick={onClick}
      className="mb-3 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all active:scale-[0.98]"
    >
      <div className="flex items-center gap-4 p-4">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
          <img
            src={store.photoUrl}
            alt={store.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1 text-left">
          <div className="mb-1 text-sm text-[#2e2e2e]">{store.name}</div>
          <div className="line-clamp-2 text-xs text-gray-400">
            {store.description}
          </div>
          {rating !== null && (
            <div className="flex items-center gap-1 text-sm font-medium text-gray-800">
              {rating} <Star className="size-4 fill-yellow-400 stroke-0" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
