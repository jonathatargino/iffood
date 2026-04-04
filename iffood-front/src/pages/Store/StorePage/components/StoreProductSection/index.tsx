import type { Product } from "@/services/product";
import { StoreProductList } from "./components/StoreProductList";
import { SectionHeader } from "@/components/SectionHeader";
import type { RefObject } from "react";
import { CenteredBouncingDots } from "@/components/CenteredBouncingDots";

interface StoreProductSectionProps {
  products: Product[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  observerRef: RefObject<HTMLDivElement | null>;
}

export function StoreProductSection({
  products,
  hasNextPage,
  isFetchingNextPage,
  observerRef,
}: StoreProductSectionProps) {
  return (
    <div>
      <SectionHeader title="Produtos" />
      <div className="px-6 py-4">
        <StoreProductList products={products} />

        {isFetchingNextPage && (
          <div className="flex justify-center py-8">
            <CenteredBouncingDots />
          </div>
        )}

        {hasNextPage && <div ref={observerRef} className="h-20"></div>}

        {!hasNextPage && products.length > 0 && (
          <div className="py-8 text-center text-sm text-gray-400">
            Você viu todos os produtos
          </div>
        )}
      </div>
    </div>
  );
}
