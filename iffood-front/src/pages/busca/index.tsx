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
      className="size-11 bg-white rounded-2xl shadow-md flex items-center justify-center active:scale-95 transition-transform"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
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
      className="w-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all mb-3 border border-gray-100 active:scale-[0.98]"
    >
      <div className="flex gap-4 items-center p-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
          <img
            src={store.photoUrl}
            alt={store.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm mb-1 text-[#2e2e2e]">{store.name}</div>
          <div className="text-xs text-gray-400 line-clamp-2">
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
      className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all mb-3 border border-gray-100 active:scale-[0.98]"
    >
      <div className="flex gap-4 items-center p-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
          <img
            src={product.photoUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm mb-1 text-[#2e2e2e]">{product.name}</div>
          <div className="text-xs text-gray-400 mb-2 line-clamp-1">
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
    ]
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
    navigate(`/produto-detalhes/${id}`);
  };

  const results = searchType === "stores" ? stores : products;
  const resultCount = results.length;
  const isLoading = searchType === "stores" ? loadingStores : loadingProducts;

  return (
    <div className="bg-[#fafafa] min-h-screen">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-[#FF7622] to-[#E6661A] px-6 pt-14 pb-8 rounded-b-[32px] shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <BackButton onClick={handleBack} />
          <h1 className="text-white text-lg">Pesquisa</h1>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3 shadow-xl">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar pratos e restaurantes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm outline-none text-[#2e2e2e] placeholder:text-gray-400"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="bg-gray-200 hover:bg-gray-300 rounded-full p-1.5 flex-shrink-0 transition-colors active:scale-95"
            >
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[#2e2e2e]">Filtros</h2>
        </div>

        {/* Type Toggle */}
        <div className="flex gap-3 mb-5">
          <button
            onClick={() => setSearchType("stores")}
            className={`flex-1 py-3.5 rounded-2xl transition-all shadow-sm ${
              searchType === "stores"
                ? "bg-[#FF7622] text-white shadow-lg"
                : "bg-white text-[#2e2e2e] hover:shadow-md"
            }`}
          >
            Restaurantes
          </button>
          <button
            onClick={() => setSearchType("products")}
            className={`flex-1 py-3.5 rounded-2xl transition-all shadow-sm ${
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
          <div className="flex gap-3 mb-5">
            <button
              onClick={() => setSelectedCategory("")}
              className={`flex-1 py-2.5 rounded-xl transition-all text-sm ${
                selectedCategory === ""
                  ? "bg-[#FF7622] text-white shadow-md"
                  : "bg-white text-[#2e2e2e] border border-gray-200 hover:border-[#FF7622]"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedCategory("savory")}
              className={`flex-1 py-2.5 rounded-xl transition-all text-sm ${
                selectedCategory === "savory"
                  ? "bg-[#FF7622] text-white shadow-md"
                  : "bg-white text-[#2e2e2e] border border-gray-200 hover:border-[#FF7622]"
              }`}
            >
              Salgado
            </button>
            <button
              onClick={() => setSelectedCategory("sweet")}
              className={`flex-1 py-2.5 rounded-xl transition-all text-sm ${
                selectedCategory === "sweet"
                  ? "bg-[#FF7622] text-white shadow-md"
                  : "bg-white text-[#2e2e2e] border border-gray-200 hover:border-[#FF7622]"
              }`}
            >
              Doce
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="px-6 pb-8">
        <h2 className="text-sm mb-5 text-gray-500">
          {resultCount} {resultCount === 1 ? "resultado" : "resultados"}{" "}
          encontrado
          {resultCount !== 1 ? "s" : ""}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl h-[88px] animate-pulse"
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
                  <div className="inline-block w-8 h-8 border-4 border-[#FF7622] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            {searchType === "products" &&
              (hasNextProducts || isFetchingNextProducts) && (
                <div ref={observerTarget} className="py-8 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-[#FF7622] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
          </>
        )}

        {resultCount === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-300" />
            </div>
            <p className="text-gray-400">Nenhum resultado encontrado</p>
            <p className="text-gray-300 text-sm mt-2">
              Tente buscar por outro termo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
