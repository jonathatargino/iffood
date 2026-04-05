import { productService } from "@/services/product";
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

export interface UseUpdateProductData {
  id: string;
  name: string;
  description: string;
  value: number;
  category: "sweet" | "savory";
  photo?: File;
  productOptions: {
    updated: { id: string; name: string; quantity: number }[];
    deleted: { id: string; name: string; quantity: number }[];
    new: { name: string; quantity: number }[];
  };
}

interface UseUpdateProductParams extends Omit<
  UseMutationOptions<any, any, any>,
  "mutationFn" | "onSuccess" | "onError"
> {
  storeId: string;
  productId: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export function useUpdateProduct({
  storeId,
  productId,
  onSuccess,
  onError,
  ...options
}: UseUpdateProductParams) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UseUpdateProductData) =>
      productService.updateProduct(data),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["store-products", storeId] });
      queryClient.refetchQueries({ queryKey: ["product", productId] });
      onSuccess?.();
    },
    onError,
    ...options,
  });
}
