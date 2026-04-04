import { useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { storeService } from "@/services/store";
import { productService } from "@/services/product";
import { LoadingView } from "@/views/LoadingView";
import { StoreProductSection } from "./components/StoreProductSection";
import { PageHeader } from "@/components/PageHeader";
import { StoreInfoSection } from "./components/StoreInfoSection";
import { StoreHeader } from "../MyStorePage/components/my-store/components/store-header";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function StorePage() {
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
    return <LoadingView />;
  }

  if (!store) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen bg-white">
      <PageHeader text={store.name} hasBackButton hideWhenNotScrolled />
      <StoreHeader photoUrl={store.photoUrl} />

      <div className="py-6">
        <StoreInfoSection store={store} />

        <StoreProductSection
          products={products}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          observerRef={observerRef}
        />
      </div>
    </div>
  );
}

export default StorePage;
