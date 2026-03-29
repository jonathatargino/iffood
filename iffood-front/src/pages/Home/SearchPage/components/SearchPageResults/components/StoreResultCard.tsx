import type { Store } from "@/services/store";

interface StoreResultCardProps {
  store: Store;
  onClick: () => void;
}

export function StoreResultCard({ store, onClick }: StoreResultCardProps) {
  return (
    <button
      onClick={onClick}
      className="mb-3 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg active:scale-[0.98]"
    >
      <div className="flex items-center gap-4 p-4">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl shadow-md">
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
        </div>
      </div>
    </button>
  );
}
