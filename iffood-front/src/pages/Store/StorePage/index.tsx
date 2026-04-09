import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { storeService } from "@/services/store";
import { LoadingView } from "@/views/LoadingView";
import { StoreProductSection } from "./components/StoreProductSection";
import { PageHeader } from "@/components/PageHeader";
import { StoreInfoSection } from "./components/StoreInfoSection";
import { StoreHeader } from "../MyStorePage/components/my-store/components/StoreHeader";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { StoreReviewsSection } from "./components/StoreReviewsSection";

export function StorePage() {
  const { storeId } = useParams<{ storeId: string }>();

  const now = new Date();
  const hours = now.toTimeString().slice(0, 5);
  const weekday = now.getDay();

  const { data: store, isLoading: loadingStore } = useQuery({
    queryKey: ["store-detail", storeId, weekday, hours],
    queryFn: () => storeService.getById(storeId!),
  });

  const products = store?.products || [];
  const reviews = store?.reviews || [];
  const reviewResume = store?.reviewResume;

  if (loadingStore) {
    return <LoadingView />;
  }

  if (!store) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen bg-white">
      <PageHeader text={store.name} hasBackButton />
      <StoreHeader photoUrl={store.photoUrl} />

      <div className="py-6">
        <StoreInfoSection store={store} />

        <StoreProductSection products={products} />
        <StoreReviewsSection reviews={reviews} reviewResume={reviewResume} />
      </div>
    </div>
  );
}

export default StorePage;
