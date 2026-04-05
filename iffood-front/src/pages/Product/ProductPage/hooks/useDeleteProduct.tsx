import { productService } from "@/services/product";
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

interface UseDeleteProductData {
  id: string;
}

interface UseDeleteProductParams extends Omit<
  UseMutationOptions<any, any, any>,
  "mutationFn" | "onSuccess" | "onError"
> {
  storeId: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export const useDeleteProduct = ({
  storeId,
  onError,
  onSuccess,
  ...options
}: UseDeleteProductParams) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UseDeleteProductData) =>
      productService.deleteProduct(data.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-products", storeId] });
      onSuccess?.();
    },
    onError,
    ...options,
  });
};
