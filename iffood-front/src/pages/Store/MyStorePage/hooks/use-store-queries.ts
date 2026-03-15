import { useQuery } from "@tanstack/react-query";
import { storeAvailabilityService } from "@/services/store-availability";
import { productService } from "@/services/product";

export const useStoreAvailabilities = (storeId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["store-availability", storeId],
    queryFn: () => storeAvailabilityService.getByStoreId(storeId),
    enabled,
  });
};

export const useStoreProducts = (storeId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["store-products", storeId],
    queryFn: () => productService.getProductsWithCountsByStore(storeId),
    enabled,
  });
};
