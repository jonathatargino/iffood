import { reviewService } from "@/services/review-service";
import { useQuery } from "@tanstack/react-query";

export function useGetPendingReview() {
  return useQuery({
    queryKey: ["pendingReview"],
    queryFn: reviewService.getPendingReview,
  });
}
