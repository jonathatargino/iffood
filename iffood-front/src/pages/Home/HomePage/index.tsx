import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product";
import { storeService } from "@/services/store";
import { useAvailability } from "@/contexts/availability/context";
import NoStoresAvailable from "@/views/no-stores-available";
import { PageHeader } from "@/components/PageHeader";
import { HomeHeader } from "./components/HomeHeader";
import { ProductsHomeSection } from "./components/ProductsHomeSection";
import { StoresHomeSection } from "./components/StoresHomeSection";
import { LoadingView } from "@/views/LoadingView";

export function HomePage() {
  const { isThereAvailableStore } = useAvailability();

  const now = new Date();
  const hours = now.toTimeString().slice(0, 5);
  const weekday = now.getDay();

  const { data: productsResponse, isLoading: loadingProducts } = useQuery({
    queryKey: ["featured-products", weekday, hours],
    queryFn: () =>
      productService.getProductsByStore(undefined, {
        pageSize: 4,
        weekday,
        hours,
      }),
    enabled: isThereAvailableStore,
  });

  const { data: storesResponse, isLoading: loadingStores } = useQuery({
    queryKey: ["featured-stores", weekday, hours],
    queryFn: () => storeService.getAllStores({ pageSize: 4, weekday, hours }),
    enabled: isThereAvailableStore,
  });

  if (!isThereAvailableStore) {
    return <NoStoresAvailable />;
  }

  const isLoading = loadingProducts || loadingStores;

  if (isLoading) {
    return <LoadingView />;
  }

  const products = productsResponse?.data || [];
  const stores = storesResponse?.data || [];

  return (
    <div className="min-h-screen bg-white">
      <PageHeader text="IFCE Campus Maracanaú" hasBackButton={false} />
      <HomeHeader />
      <ProductsHomeSection products={products} />
      <StoresHomeSection stores={stores} />
    </div>
  );
}

export default HomePage;
