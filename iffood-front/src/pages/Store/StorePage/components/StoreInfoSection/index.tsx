import type { Store } from "@/services/store";

interface StoreInfoSectionProps {
  store: Store;
}

export function StoreInfoSection({ store }: StoreInfoSectionProps) {
  return (
    <div className="px-6">
      <div className="mb-8">
        <h1 className="mb-2 font-bold text-[#181c2e]">{store.name}</h1>
        <p className="text-sm leading-relaxed text-[#93969a]">
          {store.description}
        </p>
      </div>
    </div>
  );
}
