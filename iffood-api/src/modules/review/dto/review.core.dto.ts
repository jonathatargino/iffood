export interface CreateReviewCoreDto {
  reviewRequestId: string;
  rating: number;
  tags?: string[];
  description?: string;
}
