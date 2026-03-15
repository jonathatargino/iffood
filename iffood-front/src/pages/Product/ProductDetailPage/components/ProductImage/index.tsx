import type { Product } from "@/services/product";
import { useNavigate } from "react-router";
import { StoreInfoBadge } from "./components/StoreInfoBadge";
import { BackButton } from "@/pages/Store/MyStorePage/components/my-store/components/back-button";

interface ProductImageProps {
  product: Product;
}

export function ProductImage({ product }: ProductImageProps) {
  const navigate = useNavigate();

  return (
    <div className="relative h-[321px] w-full overflow-hidden">
      <img
        src={product.photoUrl}
        alt={product.name}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

      <div className="absolute top-8 left-6">
        <BackButton onClick={() => navigate(-1)} />
      </div>

      <div className="absolute bottom-12 left-6">
        <StoreInfoBadge
          // Todo: adjust types to ensure store is always present in this scenario
          photoUrl={product.store?.photoUrl!}
          name={product.store?.name!}
          // TODO: Check store availability
          isStoreAvailable={true}
        />
      </div>
    </div>
  );
}
