import type { Product } from "@/services/product";
import { StoreProductList } from "./components/StoreProductList";
import { SectionHeader } from "@/components/SectionHeader";

interface StoreProductSectionProps {
  products: Product[];
}

export function StoreProductSection({ products }: StoreProductSectionProps) {
  return (
    <div>
      <SectionHeader title="Produtos" />
      <div className="px-6 py-4">
        <StoreProductList products={products} />
      </div>
    </div>
  );
}
