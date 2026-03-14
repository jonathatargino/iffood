import { BackButton } from "@/pages/minha-loja/components/my-store/components/back-button";
import type { Product } from "@/services/product";
import { useNavigate } from "react-router";
import { StoreInfoBadge } from "./components/StoreInfoBadge";

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
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

      <div className="absolute left-6 top-8">
        <BackButton onClick={() => navigate(-1)} />
      </div>

      <div className="absolute left-6 bottom-12">
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
