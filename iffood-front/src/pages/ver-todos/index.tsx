import { useState, useRef, useCallback, useEffect } from "react";
import { Search, X, Menu } from "lucide-react";
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

function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="size-11 bg-white rounded-2xl shadow-md flex items-center justify-center hover:shadow-lg transition-all active:scale-95"
    >
      <Menu className="w-6 h-6 text-[#2e2e2e]" />
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
      className="w-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100 active:scale-[0.98]"
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <img
          src={store.photoUrl}
          alt={store.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-[#2e2e2e] mb-1 line-clamp-1 text-left">
          {store.name}
        </h3>
        <div className="text-xs text-gray-400 line-clamp-2 text-left">
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
      className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100 active:scale-[0.98]"
    >
      <div className="aspect-square relative overflow-hidden">
        <img
          src={product.photoUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-[#FF7622] text-white text-xs px-2.5 py-1 rounded-full shadow-md">
          {formatCentsToReaisWithSymbol(product.value)}
        </div>
      </div>
      <div className="p-3 pb-4">
        <div className="text-sm line-clamp-1 text-[#2e2e2e] mb-1">
          {product.name}
        </div>
        <div className="text-xs text-gray-400 line-clamp-1">
          {product.description}
        </div>
      </div>
    </button>
  );
}

export default function ViewAllPage() {
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

  const handleMenuClick = () => {
    navigate("/configuracoes");
  };

  const results = viewType === "stores" ? stores : products;
  const totalCount = viewType === "stores" ? stores.length : products.length;
  const resultCount = results.length;

  const pageTitle =
    viewType === "stores" ? "Todos os Restaurantes" : "Todos os Pratos";
  const isLoading = viewType === "stores" ? loadingStores : loadingProducts;

  return (
    <div className="bg-[#fafafa] min-h-screen">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-[#FF7622] to-[#E6661A] px-6 pt-14 pb-6 rounded-b-[32px] shadow-lg sticky top-0 z-10">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <BackButton onClick={handleBack} />
          <h1 className="text-white text-lg flex-1">{pageTitle}</h1>
          <MenuButton onClick={handleMenuClick} />
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3 shadow-xl">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder={
              viewType === "stores"
                ? "Buscar restaurantes..."
                : "Buscar pratos..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm outline-none text-[#2e2e2e] placeholder:text-gray-400"
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

        {/* Category Filter - Only for products */}
        {viewType === "products" && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setSelectedCategory("")}
              className={`flex-1 py-2.5 rounded-xl transition-all text-sm ${
                selectedCategory === ""
                  ? "bg-white text-[#FF7622] shadow-md font-medium"
                  : "bg-white/20 text-white border border-white/30 hover:bg-white/30"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedCategory("savory")}
              className={`flex-1 py-2.5 rounded-xl transition-all text-sm ${
                selectedCategory === "savory"
                  ? "bg-white text-[#FF7622] shadow-md font-medium"
                  : "bg-white/20 text-white border border-white/30 hover:bg-white/30"
              }`}
            >
              Salgado
            </button>
            <button
              onClick={() => setSelectedCategory("sweet")}
              className={`flex-1 py-2.5 rounded-xl transition-all text-sm ${
                selectedCategory === "sweet"
                  ? "bg-white text-[#FF7622] shadow-md font-medium"
                  : "bg-white/20 text-white border border-white/30 hover:bg-white/30"
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
        <div className="flex items-center justify-between mb-5">
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
                  className="bg-white rounded-2xl h-[250px] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pb-8">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl h-[220px] animate-pulse"
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
                <div className="inline-block w-8 h-8 border-4 border-[#FF7622] border-t-transparent rounded-full animate-spin" />
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
                <div className="inline-block w-8 h-8 border-4 border-[#FF7622] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {resultCount === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-300" />
            </div>
            <p className="text-gray-400">Nenhum resultado encontrado</p>
            <p className="text-gray-300 text-sm mt-2">
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
