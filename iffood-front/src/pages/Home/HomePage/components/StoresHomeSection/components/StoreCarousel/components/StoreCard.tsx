import type { Store } from "@/services/store";
import { Star } from "lucide-react";

interface StoreCardProps {
  store: Store;
  onClick: () => void;
}

export function StoreCard({ store, onClick }: StoreCardProps) {
  const rating = store.rating ? store.rating.toFixed(1) : null;

  return (
    <button
      onClick={onClick}
      className="mb-4 w-full overflow-hidden rounded-lg border border-gray-100 bg-white text-left shadow-sm transition-all hover:shadow-xl active:scale-[0.98]"
    >
      <div className="relative h-[160px] overflow-hidden">
        <img
          src={store.photoUrl}
          alt={store.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="absolute right-0 bottom-0 left-0 p-4 text-white">
          <div className="mb-1 font-bold">{store.name}</div>
          <div className="line-clamp-1 text-xs text-white/80">
            {store.description}
          </div>
        </div>
        {rating !== null && (
          <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-sm font-medium text-gray-800">
            {rating} <Star className="size-4 fill-yellow-400 stroke-0" />
          </div>
        )}
      </div>
    </button>
  );
}
