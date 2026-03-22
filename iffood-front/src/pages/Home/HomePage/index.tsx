import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productService, type Product } from "@/services/product";
import { storeService, type Store } from "@/services/store";
import { useNavigate } from "react-router";
import { formatCentsToReaisWithSymbol } from "@/utils/currency";
import { useAuth } from "@/contexts/auth/context";
import { useAvailability } from "@/contexts/availability/context";
import NoStoresAvailable from "@/views/no-stores-available";
import { PageHeader } from "@/components/PageHeader";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <button
      onClick={onClick}
      className="min-w-[170px] snap-start overflow-hidden rounded-3xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:shadow-xl active:scale-[0.98]"
    >
      <div className="relative h-[120px] w-full overflow-hidden">
        <img
          src={product.photoUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-2 right-2 rounded-full bg-[#FF7622] px-2.5 py-1 text-xs text-white shadow-md">
          {formatCentsToReaisWithSymbol(product.value)}
        </div>
      </div>
      <div className="p-4">
        <div className="mb-1 line-clamp-1 text-[#2e2e2e]">{product.name}</div>
        <div className="line-clamp-1 text-xs text-gray-400">
          {product.description}
        </div>
      </div>
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
      className="mb-4 w-full overflow-hidden rounded-3xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:shadow-xl active:scale-[0.98]"
    >
      <div className="relative h-[160px] overflow-hidden">
        <img
          src={store.photoUrl}
          alt={store.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="absolute right-0 bottom-0 left-0 p-4 text-white">
          <div className="mb-1">{store.name}</div>
          <div className="line-clamp-1 text-xs text-white/80">
            {store.description}
          </div>
        </div>
      </div>
    </button>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const username =
    session?.user.user_metadata.name?.split(" ")[0] || "Convidado";

  const now = new Date();
  const hours = now.toTimeString().slice(0, 5);
  const weekday = now.getDay();

  // Fetch products (all stores)
  const { data: productsResponse, isLoading: loadingProducts } = useQuery({
    queryKey: ["featured-products", weekday, hours],
    queryFn: () =>
      productService.getProductsByStore(undefined, {
        pageSize: 4,
        weekday,
        hours,
      }),
  });

  const products = productsResponse?.data || [];

  // Fetch stores
  const { data: storesResponse, isLoading: loadingStores } = useQuery({
    queryKey: ["featured-stores", weekday, hours],
    queryFn: () => storeService.getAllStores({ pageSize: 4, weekday, hours }),
  });

  const stores = storesResponse?.data || [];

  const handleSearchClick = () => {
    navigate("/busca");
  };

  const handleProductClick = (id: string) => {
    navigate(`/produto/detalhes/${id}`);
  };

  const handleStoreClick = (id: string) => {
    navigate(`/loja/${id}`);
  };

  const handleViewAllProducts = () => {
    navigate("/produtos");
  };

  const handleViewAllStores = () => {
    navigate("/restaurantes");
  };

  const { isThereAvailableStore } = useAvailability();

  if (!isThereAvailableStore) {
    return <NoStoresAvailable />;
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <PageHeader text="IFCE Campus Maracanaú" hasBackButton={false} />
      {/* Header with gradient */}
      <div className="rounded-b-[32px] bg-gradient-to-br from-[#FF7622] to-[#E6661A] px-6 pt-14 pb-8 shadow-lg">
        {/* Top Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-lg text-white">Olá, {username}! 👋</h1>
            <p className="text-sm text-white/80">O que vai pedir hoje?</p>
          </div>
        </div>

        {/* Search Bar */}
        <button
          onClick={handleSearchClick}
          className="flex w-full items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl transition-shadow hover:shadow-2xl active:scale-[0.98]"
        >
          <Search className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-400">
            Buscar pratos e restaurantes...
          </span>
        </button>
      </div>

      {/* Products Carousel */}
      <div className="mt-8 mb-8">
        <div className="mb-5 flex items-center justify-between px-6">
          <h2 className="text-[#2e2e2e]">Destaques para você</h2>
          <button
            className="flex items-center gap-1 text-sm text-[#FF7622] transition-all hover:gap-2"
            onClick={handleViewAllProducts}
          >
            <span>Ver todos</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path
                d="M9 18l6-6-6-6"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>

        {loadingProducts ? (
          <div className="flex gap-4 px-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-[200px] min-w-[170px] animate-pulse rounded-3xl bg-gray-200"
              />
            ))}
          </div>
        ) : (
          <div className="scrollbar-hide overflow-x-auto">
            <div className="flex snap-x snap-mandatory gap-4 px-6 pb-2">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => handleProductClick(product.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stores List */}
      <div className="px-6 pb-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[#2e2e2e]">Restaurantes abertos</h2>
          <button
            className="flex items-center gap-1 text-sm text-[#FF7622] transition-all hover:gap-2"
            onClick={handleViewAllStores}
          >
            <span>Ver todos</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path
                d="M9 18l6-6-6-6"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>

        {loadingStores ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-[200px] animate-pulse rounded-3xl bg-gray-200"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {stores.slice(0, 4).map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                onClick={() => handleStoreClick(store.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
