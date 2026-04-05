import { api } from "@/lib/api";
import type { Review, ReviewRequest } from "@/models/review";

export const reviewService = {
  getPendingReview: async () => {
    const response = await api.get<ReviewRequest>("/review/request/latest");
    return response.data;
  },
  createReview: async (data: Omit<Review, "id" | "createdAt">) => {
    const response = await api.post("/review", data);
    return response.data;
  },

  denyReviewRequest: async (reviewRequestId: string) => {
    await api.patch(`/review/request/${reviewRequestId}/deny`);
  },
};
