import { useState, useRef, useCallback, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { productService, type Product } from "@/services/product";
import { storeService, type Store } from "@/services/store";
import { useNavigate, useParams } from "react-router";
import { formatCentsToReaisWithSymbol } from "@/utils/currency";

type ViewType = "products" | "stores";

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

interface StoreCardProps {
  store: Store;
  onClick: () => void;
}

function StoreCard({ store, onClick }: StoreCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg active:scale-[0.98]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={store.photoUrl}
          alt={store.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="mb-1 line-clamp-1 text-left text-[#2e2e2e]">
          {store.name}
        </h3>
        <div className="line-clamp-2 text-left text-xs text-gray-400">
          {store.description}
        </div>
      </div>
    </button>
  );
}

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:shadow-lg active:scale-[0.98]"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.photoUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-2 right-2 rounded-full bg-[#FF7622] px-2.5 py-1 text-xs text-white shadow-md">
          {formatCentsToReaisWithSymbol(product.value)}
        </div>
      </div>
      <div className="p-3 pb-4">
        <div className="mb-1 line-clamp-1 text-sm text-[#2e2e2e]">
          {product.name}
        </div>
        <div className="line-clamp-1 text-xs text-gray-400">
          {product.description}
        </div>
      </div>
    </button>
  );
}

export function ViewAllResourceByTypePage() {
  const navigate = useNavigate();
  const { type } = useParams<{ type: "produtos" | "restaurantes" }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const observerTarget = useRef<HTMLDivElement>(null);

  const viewType: ViewType = type === "produtos" ? "products" : "stores";

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
    queryKey: ["all-stores", searchQuery, weekday, hours],
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
    queryKey: ["all-products", searchQuery, selectedCategory, weekday, hours],
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
    enabled: viewType === "products",
  });

  const stores = storesData?.pages.flatMap((page) => page.data) ?? [];
  const products = productsData?.pages.flatMap((page) => page.data) ?? [];

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting) {
        if (viewType === "stores" && hasNextStores && !isFetchingNextStores) {
          fetchNextStores();
        } else if (
          viewType === "products" &&
          hasNextProducts &&
          !isFetchingNextProducts
        ) {
          fetchNextProducts();
        }
      }
    },
    [
      viewType,
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

  const results = viewType === "stores" ? stores : products;
  const totalCount = viewType === "stores" ? stores.length : products.length;
  const resultCount = results.length;

  const pageTitle =
    viewType === "stores" ? "Todos os Restaurantes" : "Todos os Pratos";
  const isLoading = viewType === "stores" ? loadingStores : loadingProducts;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header with gradient */}
      <div className="sticky top-0 z-10 rounded-b-[32px] bg-gradient-to-br from-[#FF7622] to-[#E6661A] px-6 pt-14 pb-6 shadow-lg">
        {/* Top Bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <BackButton onClick={handleBack} />
          <h1 className="flex-1 text-lg text-white">{pageTitle}</h1>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl">
          <Search className="h-5 w-5 flex-shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder={
              viewType === "stores"
                ? "Buscar restaurantes..."
                : "Buscar pratos..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm text-[#2e2e2e] outline-none placeholder:text-gray-400"
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

        {/* Category Filter - Only for products */}
        {viewType === "products" && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setSelectedCategory("")}
              className={`flex-1 rounded-xl py-2.5 text-sm transition-all ${
                selectedCategory === ""
                  ? "bg-white font-medium text-[#FF7622] shadow-md"
                  : "border border-white/30 bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedCategory("savory")}
              className={`flex-1 rounded-xl py-2.5 text-sm transition-all ${
                selectedCategory === "savory"
                  ? "bg-white font-medium text-[#FF7622] shadow-md"
                  : "border border-white/30 bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Salgado
            </button>
            <button
              onClick={() => setSelectedCategory("sweet")}
              className={`flex-1 rounded-xl py-2.5 text-sm transition-all ${
                selectedCategory === "sweet"
                  ? "bg-white font-medium text-[#FF7622] shadow-md"
                  : "border border-white/30 bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Doce
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="px-6 py-6">
        {/* Results count */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm text-gray-500">
            {searchQuery
              ? `${resultCount} ${
                  resultCount === 1 ? "resultado" : "resultados"
                } encontrado${resultCount !== 1 ? "s" : ""}`
              : `${totalCount} ${totalCount === 1 ? "item" : "itens"} no total`}
          </h2>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-[#FF7622] hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          viewType === "stores" ? (
            <div className="grid grid-cols-1 gap-4 pb-8">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-[250px] animate-pulse rounded-2xl bg-gray-200"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pb-8">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-[220px] animate-pulse rounded-2xl bg-gray-200"
                />
              ))}
            </div>
          )
        ) : viewType === "stores" ? (
          <>
            <div className="grid grid-cols-1 gap-4 pb-8">
              {stores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  onClick={() => handleStoreClick(store.id)}
                />
              ))}
            </div>
            {(hasNextStores || isFetchingNextStores) && (
              <div ref={observerTarget} className="py-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#FF7622] border-t-transparent" />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 pb-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => handleProductClick(product.id)}
                />
              ))}
            </div>
            {(hasNextProducts || isFetchingNextProducts) && (
              <div ref={observerTarget} className="py-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#FF7622] border-t-transparent" />
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {resultCount === 0 && !isLoading && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-12 w-12 text-gray-300" />
            </div>
            <p className="text-gray-400">Nenhum resultado encontrado</p>
            <p className="mt-2 text-sm text-gray-300">
              {searchQuery
                ? "Tente buscar por outro termo"
                : "Nenhum item disponível"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewAllResourceByTypePage;
