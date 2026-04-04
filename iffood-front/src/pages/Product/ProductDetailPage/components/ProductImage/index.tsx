import type { Product } from "@/services/product";
import { StoreInfoBadge } from "./components/StoreInfoBadge";

interface ProductImageProps {
  product: Product;
}

export function ProductImage({ product }: ProductImageProps) {
  return (
    <div className="relative h-[321px] w-full overflow-hidden">
      <img
        src={product.photoUrl}
        alt={product.name}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
      <div className="absolute bottom-12 left-6">
        <StoreInfoBadge
          // Todo: adjust types to ensure store is always present in this scenario
          photoUrl={product.store?.photoUrl!}
          name={product.store?.name!}
          isStoreAvailable={product.store?.isAvailable!}
        />
      </div>
    </div>
  );
}
