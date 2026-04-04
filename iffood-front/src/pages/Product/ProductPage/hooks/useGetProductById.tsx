import { productService, type Product } from "@/services/product";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

interface UseGetProductByIdParams extends Omit<
  UseQueryOptions<Product>,
  "queryKey" | "queryFn"
> {
  id: string;
}

export function useGetProductById({ id, ...options }: UseGetProductByIdParams) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productService.getProductById(id),
    ...options,
  });
}
