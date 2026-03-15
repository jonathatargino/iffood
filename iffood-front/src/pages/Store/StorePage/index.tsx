import { useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { storeService } from "@/services/store";
import { productService, type Product } from "@/services/product";
import { formatCentsToReaisWithSymbol } from "@/utils/currency";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-2xl bg-white/95 shadow-xl backdrop-blur-md transition-all hover:bg-white active:scale-95"
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

function ProductCard({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="overflow-hidden rounded-3xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:shadow-xl active:scale-[0.98]"
    >
      <div className="relative h-[110px] w-full overflow-hidden">
        <img
          src={product.photoUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-3 pb-4">
        <div className="mb-1 text-sm text-[#FF7622]">
          {formatCentsToReaisWithSymbol(product.value)}
        </div>
        <div className="line-clamp-1 text-sm text-[#2e2e2e]">
          {product.name}
        </div>
      </div>
    </button>
  );
}

export function StorePage() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const observerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const hours = now.toTimeString().slice(0, 5);
  const weekday = now.getDay();

  const { data: storesResponse, isLoading: loadingStore } = useQuery({
    queryKey: ["store-detail", storeId, weekday, hours],
    queryFn: () => storeService.getAllStores({ weekday, hours, pageSize: 100 }),
  });

  const {
    data: productsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingProducts,
  } = useInfiniteQuery({
    queryKey: ["store-products-public", storeId, weekday, hours],
    queryFn: ({ pageParam = 1 }) =>
      productService.getProductsByStore(storeId, {
        page: pageParam,
        pageSize: 6,
        weekday,
        hours,
      }),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!storeId,
  });

  const store = storesResponse?.data?.find((s) => s.id === storeId);
  const products = productsData?.pages.flatMap((page) => page.data) ?? [];
  const productCount = productsData?.pages[0]?.total || 0;

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const element = observerRef.current;
    const option = { threshold: 0.1 };

    const observer = new IntersectionObserver(handleObserver, option);
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  if (loadingStore || loadingProducts) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-[#FF7622] border-t-transparent" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <p className="text-gray-500">Loja não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Restaurant Image */}
      <div className="relative h-[321px] w-full overflow-hidden">
        <img
          src={store.photoUrl}
          alt={store.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

        {/* Back Button */}
        <div className="absolute top-14 left-6">
          <BackButton onClick={() => navigate(-1)} />
        </div>
      </div>

      {/* Restaurant Info and Products */}
      <div className="px-6 py-6">
        {/* Restaurant Details */}
        <div className="mb-8">
          <h1 className="mb-2 text-[#181c2e]">{store.name}</h1>
          <p className="text-sm leading-relaxed text-[#93969a]">
            {store.description ||
              "Onde cada mordida tem sabor de casa. Doces fresquinhos, preparados com carinho."}
          </p>
        </div>

        {/* Products Section */}
        <div>
          <h2 className="mb-5 text-[#181c2e]">
            {productCount} {productCount === 1 ? "Produto" : "Produtos"}
          </h2>

          {productCount === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-gray-100">
                <svg
                  className="h-10 w-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M20 7h-4m0 10v-5m0 0V7m0 5h5m-5 0H8m12-6.74V17a2 2 0 01-2 2H6a2 2 0 01-2-2V4.26A1 1 0 014.74 3H6a2 2 0 012 2v1h8V5a2 2 0 012-2h1.26a1 1 0 01.74 1.26z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <p className="mb-1 text-gray-500">Nenhum produto disponível</p>
              <p className="text-sm text-gray-400">
                Esta loja ainda não cadastrou produtos
              </p>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="mb-8 grid grid-cols-2 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => navigate(`/produto/detalhes/${product.id}`)}
                  />
                ))}
              </div>

              {/* Loading indicator */}
              {isFetchingNextPage && (
                <div className="flex justify-center py-8">
                  <div className="flex gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-[#FF7622]"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-[#FF7622] [animation-delay:0.2s]"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-[#FF7622] [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}

              {/* Infinite scroll trigger */}
              {hasNextPage && <div ref={observerRef} className="h-20"></div>}

              {/* End message */}
              {!hasNextPage && products.length > 0 && (
                <div className="py-8 text-center text-sm text-gray-400">
                  Você viu todos os produtos
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
