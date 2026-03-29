import { useState, useRef, useCallback, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { productService } from "@/services/product";
import { storeService } from "@/services/store";
import { useNavigate, useSearchParams } from "react-router";
import { SearchPageHeader } from "./components/SearchPageHeader";
import { PageHeader } from "@/components/PageHeader";
import { parseSearchPageSearchParams } from "./utils";
import { SearchPageFilters } from "./components/SearchPageFilters";
import { SearchPageResults } from "./components/SearchPageResults";
import { useDebounce } from "@/hooks/useDebounce";

type SearchType = "stores" | "products";

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const parsedSearchParams = parseSearchPageSearchParams(searchParams);

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(parsedSearchParams.q || "");
  const [searchType, setSearchType] = useState<SearchType>(
    parsedSearchParams.type as SearchType,
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    parsedSearchParams.category || "",
  );
  const observerTarget = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

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
    queryKey: ["stores", debouncedSearchQuery, weekday, hours],
    queryFn: ({ pageParam = 1 }) =>
      storeService.getAllStores({
        name: debouncedSearchQuery || undefined,
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
    queryKey: [
      "products",
      debouncedSearchQuery,
      selectedCategory,
      weekday,
      hours,
    ],
    queryFn: ({ pageParam = 1 }) =>
      productService.getProductsByStore(undefined, {
        page: pageParam,
        pageSize: 20,
        name: debouncedSearchQuery || undefined,
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
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("q", "");
      return newParams;
    });
  };

  const handleStoreClick = (id: string) => {
    navigate(`/loja/${id}`);
  };

  const handleProductClick = (id: string) => {
    navigate(`/produto/detalhes/${id}`);
  };

  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("type", type);
      return newParams;
    });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("category", category);
      return newParams;
    });
  };

  const isLoading = searchType === "stores" ? loadingStores : loadingProducts;
  const typeLabel = searchType === "stores" ? "Restaurantes" : "Produtos";
  const pageHeaderText = searchQuery
    ? `${typeLabel} - ${searchQuery}`
    : typeLabel;

  return (
    <div className="min-h-screen bg-white">
      <PageHeader text={pageHeaderText} hasBackButton />
      <SearchPageHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleClearSearch={handleClearSearch}
      />

      <SearchPageFilters
        searchType={searchType}
        selectedCategory={selectedCategory}
        handleSearchTypeChange={handleSearchTypeChange}
        handleCategoryChange={handleCategoryChange}
      />

      <SearchPageResults
        handleProductClick={handleProductClick}
        handleStoreClick={handleStoreClick}
        searchType={searchType}
        stores={stores}
        products={products}
        isLoading={isLoading}
        hasNextProducts={hasNextProducts}
        hasNextStores={hasNextStores}
        isFetchingNextProducts={isFetchingNextProducts}
        isFetchingNextStores={isFetchingNextStores}
        observerTarget={observerTarget}
      />
    </div>
  );
}

export default SearchPage;
