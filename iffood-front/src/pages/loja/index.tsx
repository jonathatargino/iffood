import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { storeService } from "@/services/store";
import { productService, type Product } from "@/services/product";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="size-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center hover:bg-white transition-all active:scale-95"
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
      className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden text-left border border-gray-100 active:scale-[0.98]"
    >
      <div className="relative h-[110px] w-full overflow-hidden">
        <img
          src={product.photoUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3 pb-4">
        <div className="text-sm mb-1 text-[#FF7622]">
          R$ {(product.value / 100).toFixed(2)}
        </div>
        <div className="text-sm line-clamp-1 text-[#2e2e2e]">
          {product.name}
        </div>
      </div>
    </button>
  );
}

export function RestaurantView() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const { data: stores, isLoading: loadingStore } = useQuery({
    queryKey: ["stores"],
    queryFn: () => storeService.getAllStores(),
  });

  const { data: allProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ["store-products-public", storeId],
    queryFn: () => productService.getProductsByStore(storeId),
    enabled: !!storeId,
  });

  const store = stores?.find((s) => s.id === storeId);

  // Initialize products
  useEffect(() => {
    if (allProducts) {
      // Load first batch
      setDisplayedProducts(allProducts.slice(0, 6));
    }
  }, [allProducts]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoadingMore &&
          allProducts &&
          displayedProducts.length < allProducts.length
        ) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [displayedProducts, allProducts, isLoadingMore]);

  const loadMoreProducts = () => {
    if (!allProducts) return;

    setIsLoadingMore(true);
    // Simulate loading delay
    setTimeout(() => {
      const currentLength = displayedProducts.length;
      const nextProducts = allProducts.slice(currentLength, currentLength + 6);
      setDisplayedProducts([...displayedProducts, ...nextProducts]);
      setIsLoadingMore(false);
    }, 500);
  };

  if (loadingStore || loadingProducts) {
    return (
      <div className="bg-[#fafafa] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-[#FF7622] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="bg-[#fafafa] min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loja não encontrada</p>
      </div>
    );
  }

  const productCount = allProducts?.length || 0;

  return (
    <div className="bg-[#fafafa] min-h-screen">
      {/* Restaurant Image */}
      <div className="relative h-[321px] w-full overflow-hidden">
        <img
          src={store.photoUrl}
          alt={store.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

        {/* Back Button */}
        <div className="absolute left-6 top-14">
          <BackButton onClick={() => navigate(-1)} />
        </div>
      </div>

      {/* Restaurant Info and Products */}
      <div className="px-6 py-6">
        {/* Restaurant Details */}
        <div className="mb-8">
          <h1 className="text-[#181c2e] mb-2">{store.name}</h1>
          <p className="text-sm text-[#93969a] leading-relaxed">
            {store.description ||
              "Onde cada mordida tem sabor de casa. Doces fresquinhos, preparados com carinho."}
          </p>
        </div>

        {/* Products Section */}
        <div>
          <h2 className="text-[#181c2e] mb-5">
            {productCount} {productCount === 1 ? "Produto" : "Produtos"}
          </h2>

          {productCount === 0 ? (
            <div className="text-center py-16">
              <div className="size-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-gray-400"
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
              <p className="text-gray-500 mb-1">Nenhum produto disponível</p>
              <p className="text-sm text-gray-400">
                Esta loja ainda não cadastrou produtos
              </p>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {displayedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => navigate(`/produto-detalhes/${product.id}`)}
                  />
                ))}
              </div>

              {/* Loading indicator */}
              {isLoadingMore && (
                <div className="flex justify-center py-8">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#FF7622] animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-[#FF7622] animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#FF7622] animate-pulse [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}

              {/* Infinite scroll trigger */}
              {displayedProducts.length < productCount && (
                <div ref={observerRef} className="h-20"></div>
              )}

              {/* End message */}
              {displayedProducts.length >= productCount && productCount > 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
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
