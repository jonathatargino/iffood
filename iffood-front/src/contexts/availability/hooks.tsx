import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export function useIsThereAvailableStoreQuery() {
  return useQuery({
    queryKey: ["is-there-available-store"],
    queryFn: async () => {
      const response = await api.get<{ available: boolean }>(
        `/store/available?weekday=${new Date().getDay()}&hours=${new Date()
          .toTimeString()
          .slice(0, 5)}`
      );

      return response.data.available;
    },
  });
}
