import { productService } from "@/services/product";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface UseCreateProductData {
  name: string;
  description: string;
  value: number;
  category: "sweet" | "savory";
  storeId: string;
  photo: File;
  productOptions: { name: string; quantity: number }[];
}

interface UseCreateProductParams {
  storeId: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export function useCreateProduct({
  storeId,
  onSuccess,
  onError,
}: UseCreateProductParams) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UseCreateProductData) =>
      productService.createProduct(data),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["store-products", storeId] });
      onSuccess?.();
    },
    onError,
  });
}
