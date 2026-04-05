import { useQuery } from "@tanstack/react-query";
import { orderRequestService } from "@/services/order-request";

export const useOrdersByStore = (storeId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["store-orders", storeId],
    queryFn: () => orderRequestService.getByStoreId(storeId),
    enabled,
  });
};
