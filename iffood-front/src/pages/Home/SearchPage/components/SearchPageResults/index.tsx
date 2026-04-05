import type { Product } from "@/services/product";
import type { Store } from "@/services/store";
import { StoreResultCard } from "./components/StoreResultCard";
import { ProductResultCard } from "./components/ProductResultCard";
import { NoResultsFoundView } from "./components/NoResultsFoundView";
import { CenteredBouncingDots } from "@/components/CenteredBouncingDots";

interface SearchPageResultsProps {
  searchType: "stores" | "products";
  stores: Store[];
  products: Product[];
  isLoading: boolean;
  handleStoreClick: (id: string) => void;
  handleProductClick: (id: string) => void;
  hasNextStores: boolean;
  isFetchingNextStores: boolean;
  hasNextProducts: boolean;
  isFetchingNextProducts: boolean;
  observerTarget: React.RefObject<HTMLDivElement | null>;
}

export function SearchPageResults({
  searchType,
  stores,
  products,
  isLoading,
  handleStoreClick,
  handleProductClick,
  hasNextStores,
  isFetchingNextStores,
  hasNextProducts,
  isFetchingNextProducts,
  observerTarget,
}: SearchPageResultsProps) {
  const resultCount = searchType === "stores" ? stores.length : products.length;

  if (isLoading) {
    return (
      <div className="flex min-h-40 flex-col">
        <CenteredBouncingDots />
      </div>
    );
  }

  if (resultCount === 0) {
    return <NoResultsFoundView />;
  }

  return (
    <div className="px-6 pb-8">
      <h2 className="mb-5 text-sm text-gray-500">
        {resultCount} {resultCount === 1 ? "resultado" : "resultados"}{" "}
        encontrado
        {resultCount !== 1 ? "s" : ""}
      </h2>

      <>
        <div className="space-y-0">
          {searchType === "stores"
            ? stores.map((store) => (
                <StoreResultCard
                  key={store.id}
                  store={store}
                  onClick={() => handleStoreClick(store.id)}
                />
              ))
            : products.map((product) => (
                <ProductResultCard
                  key={product.id}
                  product={product}
                  onClick={() => handleProductClick(product.id)}
                />
              ))}
        </div>
        {searchType === "stores" && (hasNextStores || isFetchingNextStores) && (
          <div ref={observerTarget} className="py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#FF7622] border-t-transparent" />
          </div>
        )}
        {searchType === "products" &&
          (hasNextProducts || isFetchingNextProducts) && (
            <div ref={observerTarget} className="py-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#FF7622] border-t-transparent" />
            </div>
          )}
      </>
    </div>
  );
}
