import type { Store } from "@/services/product";

interface StoreInfoBadgeProps {
  store: Store;
}

export function StoreInfoBadge({ store }: StoreInfoBadgeProps) {
  const rating = store.rating ? store.rating.toFixed(1) : null;

  return (
    <div
      className={`flex items-center rounded-full border bg-white p-6 py-1 pr-3 pl-1`}
    >
      <img
        src={store.photoUrl}
        alt={store.name}
        className="mr-2 h-10 w-10 rounded-full"
      />
      <div className="text-xs">
        <span className="font-bold">{store.name}</span>
        <br />
        <span
          className={`text-xs ${store.isAvailable ? "text-green-700" : "text-red-700"}`}
        >
          {store.isAvailable ? "Aberto agora" : "Fechado"}
        </span>
      </div>
      {rating !== null && (
        <div className="ml-3 flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-sm font-medium text-gray-800">
          {rating} <span className="text-yellow-400">★</span>
        </div>
      )}
    </div>
  );
}
