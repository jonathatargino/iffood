import type { Store } from "@/services/store";
import { StoreCard } from "./components/StoreCard";

interface StoreCarouselProps {
  stores: Store[];
  onClick: (id: string) => void;
}

export function StoreCarousel({ stores, onClick }: StoreCarouselProps) {
  return (
    <div className="space-y-4">
      {stores.slice(0, 4).map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          onClick={() => onClick(store.id)}
        />
      ))}
    </div>
  );
}
