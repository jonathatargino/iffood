import { reviewService } from "@/services/review-service";
import { useMutation } from "@tanstack/react-query";

export function useCreateReview() {
  return useMutation({
    mutationFn: reviewService.createReview,
  });
}
