import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productService, type Product } from "@/services/product";
import { storeService, type Store } from "@/services/store";
import { useNavigate } from "react-router";
import { formatCentsToReaisWithSymbol } from "@/utils/currency";
import { useAuth } from "@/contexts/auth/context";
import { useEffect } from "react";

function MenuIcon({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="size-11 bg-white rounded-2xl shadow-xl flex items-center justify-center hover:shadow-2xl transition-all active:scale-95"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
        <path
          d="M4 18h10M4 12h16M4 6h7"
          stroke="#FF7622"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
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
      className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden min-w-[170px] snap-start text-left border border-gray-100 active:scale-[0.98]"
    >
      <div className="relative h-[120px] w-full overflow-hidden">
        <img
          src={product.photoUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-[#FF7622] text-white text-xs px-2.5 py-1 rounded-full shadow-md">
          {formatCentsToReaisWithSymbol(product.value)}
        </div>
      </div>
      <div className="p-4">
        <div className="mb-1 line-clamp-1 text-[#2e2e2e]">{product.name}</div>
        <div className="text-xs text-gray-400 line-clamp-1">
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
      className="w-full mb-4 text-left bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 active:scale-[0.98]"
    >
      <div className="relative h-[160px] overflow-hidden">
        <img
          src={store.photoUrl}
          alt={store.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="mb-1">{store.name}</div>
          <div className="text-xs text-white/80 line-clamp-1">
            {store.description}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Home() {
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

  useEffect(() => {
    if (!loadingStores && !loadingProducts && stores.length === 0 && products.length === 0) {
      navigate("/sem-lojas-disponiveis");
    }
  }, [loadingStores, loadingProducts, stores.length, products.length, navigate]);

  const handleSearchClick = () => {
    navigate("/busca");
  };

  const handleProductClick = (id: string) => {
    navigate(`/produto-detalhes/${id}`);
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

  const handleMenuClick = () => {
    navigate("/configuracoes");
  };

  return (
    <div className="bg-[#fafafa] min-h-screen">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-[#FF7622] to-[#E6661A] px-6 pt-14 pb-8 rounded-b-[32px] shadow-lg">
        {/* Top Header */}
        <div className="flex items-center gap-3 mb-8">
          <MenuIcon onClick={handleMenuClick} />
          <div className="flex-1">
            <h1 className="text-white text-lg">Olá, {username}! 👋</h1>
            <p className="text-white/80 text-sm">O que vai pedir hoje?</p>
          </div>
        </div>

        {/* Search Bar */}
        <button
          onClick={handleSearchClick}
          className="bg-white rounded-2xl w-full px-5 py-4 flex items-center gap-3 shadow-xl hover:shadow-2xl transition-shadow active:scale-[0.98]"
        >
          <Search className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-400">
            Buscar pratos e restaurantes...
          </span>
        </button>
      </div>

      {/* Products Carousel */}
      <div className="mt-8 mb-8">
        <div className="px-6 mb-5 flex items-center justify-between">
          <h2 className="text-[#2e2e2e]">Destaques para você</h2>
          <button
            className="text-[#FF7622] text-sm flex items-center gap-1 hover:gap-2 transition-all"
            onClick={handleViewAllProducts}
          >
            <span>Ver todos</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
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
          <div className="px-6 flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl min-w-[170px] h-[200px] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 px-6 snap-x snap-mandatory pb-2">
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
          <h2 className="text-[#2e2e2e]">Restaurantes</h2>
          <button
            className="text-[#FF7622] text-sm flex items-center gap-1 hover:gap-2 transition-all"
            onClick={handleViewAllStores}
          >
            <span>Ver todos</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
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
                className="bg-white rounded-3xl h-[200px] animate-pulse"
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
