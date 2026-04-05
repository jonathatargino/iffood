import type { Review } from "@/models/review";
import { reviewService } from "@/services/review-service";
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

type UseCreateReviewParams = UseMutationOptions<
  unknown,
  Error,
  Omit<Review, "id" | "createdAt">,
  unknown
>;

export function useCreateReview(params: UseCreateReviewParams = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    ...params,
    mutationFn: reviewService.createReview,
    onSuccess: (data, variables, result, context) => {
      queryClient.invalidateQueries({ queryKey: ["pendingReview"] });
      params.onSuccess?.(data, variables, result, context);
    },
  });
}
