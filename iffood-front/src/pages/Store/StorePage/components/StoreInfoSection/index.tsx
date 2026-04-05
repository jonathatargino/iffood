import type { Store } from "@/services/store";
import { Star } from "lucide-react";

interface StoreInfoSectionProps {
  store: Store;
}

export function StoreInfoSection({ store }: StoreInfoSectionProps) {
  const rating = store.rating ? store.rating.toFixed(1) : null;

  return (
    <div className="px-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="mb-2 font-bold text-[#181c2e]">{store.name}</h1>
          {rating !== null && (
            <div className="flex items-center gap-1">
              {rating} <Star className="size-4 fill-yellow-400 stroke-0" />
            </div>
          )}
        </div>
        <p className="text-sm leading-relaxed text-[#93969a]">
          {store.description}
        </p>
      </div>
    </div>
  );
}
