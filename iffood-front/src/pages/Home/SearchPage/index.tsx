import { useState, useRef, useCallback, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { productService, type Product } from "@/services/product";
import { storeService, type Store } from "@/services/store";
import { useNavigate } from "react-router";
import { formatCentsToReaisWithSymbol } from "@/utils/currency";

type SearchType = "stores" | "products";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-md transition-transform active:scale-95"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M15 18l-6-6 6-6"
          stroke="#2e2e2e"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </button>
  );
}

interface StoreResultCardProps {
  store: Store;
  onClick: () => void;
}

function StoreResultCard({ store, onClick }: StoreResultCardProps) {
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

interface ProductResultCardProps {
  product: Product;
  onClick?: () => void;
}

function ProductResultCard({ product, onClick }: ProductResultCardProps) {
  return (
    <button
      onClick={onClick}
      className="mb-3 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:shadow-lg active:scale-[0.98]"
    >
      <div className="flex items-center gap-4 p-4">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl shadow-md">
          <img
            src={product.photoUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1 text-left">
          <div className="mb-1 text-sm text-[#2e2e2e]">{product.name}</div>
          <div className="mb-2 line-clamp-1 text-xs text-gray-400">
            {product.description}
          </div>
          <div className="text-[#FF7622]">
            {formatCentsToReaisWithSymbol(product.value)}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("stores");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const observerTarget = useRef<HTMLDivElement>(null);

  const now = new Date();
  const hours = now.toTimeString().slice(0, 5);
  const weekday = now.getDay();

  const {
    data: storesData,
    fetchNextPage: fetchNextStores,
    hasNextPage: hasNextStores,
    isFetchingNextPage: isFetchingNextStores,
    isLoading: loadingStores,
  } = useInfiniteQuery({
    queryKey: ["stores", searchQuery, weekday, hours],
    queryFn: ({ pageParam = 1 }) =>
      storeService.getAllStores({
        name: searchQuery || undefined,
        page: pageParam,
        pageSize: 20,
        weekday,
        hours,
      }),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const {
    data: productsData,
    fetchNextPage: fetchNextProducts,
    hasNextPage: hasNextProducts,
    isFetchingNextPage: isFetchingNextProducts,
    isLoading: loadingProducts,
  } = useInfiniteQuery({
    queryKey: ["products", searchQuery, selectedCategory, weekday, hours],
    queryFn: ({ pageParam = 1 }) =>
      productService.getProductsByStore(undefined, {
        page: pageParam,
        pageSize: 20,
        name: searchQuery || undefined,
        category: selectedCategory || undefined,
        weekday,
        hours,
      }),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const stores = storesData?.pages.flatMap((page) => page.data) ?? [];
  const products = productsData?.pages.flatMap((page) => page.data) ?? [];

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting) {
        if (searchType === "stores" && hasNextStores && !isFetchingNextStores) {
          fetchNextStores();
        } else if (
          searchType === "products" &&
          hasNextProducts &&
          !isFetchingNextProducts
        ) {
          fetchNextProducts();
        }
      }
    },
    [
      searchType,
      hasNextStores,
      hasNextProducts,
      isFetchingNextStores,
      isFetchingNextProducts,
      fetchNextStores,
      fetchNextProducts,
    ],
  );

  useEffect(() => {
    const element = observerTarget.current;
    const option = { threshold: 0 };

    const observer = new IntersectionObserver(handleObserver, option);
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleStoreClick = (id: string) => {
    navigate(`/loja/${id}`);
  };

  const handleProductClick = (id: string) => {
    navigate(`/produto/detalhes/${id}`);
  };

  const results = searchType === "stores" ? stores : products;
  const resultCount = results.length;
  const isLoading = searchType === "stores" ? loadingStores : loadingProducts;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header with gradient */}
      <div className="rounded-b-[32px] bg-gradient-to-br from-[#FF7622] to-[#E6661A] px-6 pt-14 pb-8 shadow-lg">
        <div className="mb-6 flex items-center gap-4">
          <BackButton onClick={handleBack} />
          <h1 className="text-lg text-white">Pesquisa</h1>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl">
          <Search className="h-5 w-5 flex-shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pratos e restaurantes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm text-[#2e2e2e] outline-none placeholder:text-gray-400"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="flex-shrink-0 rounded-full bg-gray-200 p-1.5 transition-colors hover:bg-gray-300 active:scale-95"
            >
              <X className="h-3.5 w-3.5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="px-6 py-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[#2e2e2e]">Filtros</h2>
        </div>

        {/* Type Toggle */}
        <div className="mb-5 flex gap-3">
          <button
            onClick={() => setSearchType("stores")}
            className={`flex-1 rounded-2xl py-3.5 shadow-sm transition-all ${
              searchType === "stores"
                ? "bg-[#FF7622] text-white shadow-lg"
                : "bg-white text-[#2e2e2e] hover:shadow-md"
            }`}
          >
            Restaurantes
          </button>
          <button
            onClick={() => setSearchType("products")}
            className={`flex-1 rounded-2xl py-3.5 shadow-sm transition-all ${
              searchType === "products"
                ? "bg-[#FF7622] text-white shadow-lg"
                : "bg-white text-[#2e2e2e] hover:shadow-md"
            }`}
          >
            Pratos
          </button>
        </div>

        {/* Category Filter - Only for products */}
        {searchType === "products" && (
          <div className="mb-5 flex gap-3">
            <button
              onClick={() => setSelectedCategory("")}
              className={`flex-1 rounded-xl py-2.5 text-sm transition-all ${
                selectedCategory === ""
                  ? "bg-[#FF7622] text-white shadow-md"
                  : "border border-gray-200 bg-white text-[#2e2e2e] hover:border-[#FF7622]"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedCategory("savory")}
              className={`flex-1 rounded-xl py-2.5 text-sm transition-all ${
                selectedCategory === "savory"
                  ? "bg-[#FF7622] text-white shadow-md"
                  : "border border-gray-200 bg-white text-[#2e2e2e] hover:border-[#FF7622]"
              }`}
            >
              Salgado
            </button>
            <button
              onClick={() => setSelectedCategory("sweet")}
              className={`flex-1 rounded-xl py-2.5 text-sm transition-all ${
                selectedCategory === "sweet"
                  ? "bg-[#FF7622] text-white shadow-md"
                  : "border border-gray-200 bg-white text-[#2e2e2e] hover:border-[#FF7622]"
              }`}
            >
              Doce
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="px-6 pb-8">
        <h2 className="mb-5 text-sm text-gray-500">
          {resultCount} {resultCount === 1 ? "resultado" : "resultados"}{" "}
          encontrado
          {resultCount !== 1 ? "s" : ""}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-[88px] animate-pulse rounded-2xl bg-gray-200"
              />
            ))}
          </div>
        ) : (
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
            {searchType === "stores" &&
              (hasNextStores || isFetchingNextStores) && (
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
        )}

        {resultCount === 0 && !isLoading && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-12 w-12 text-gray-300" />
            </div>
            <p className="text-gray-400">Nenhum resultado encontrado</p>
            <p className="mt-2 text-sm text-gray-300">
              Tente buscar por outro termo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
