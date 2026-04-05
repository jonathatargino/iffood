import { CreateReviewCoreDto } from './review.core.dto';

export interface ServiceCreateReviewDto extends CreateReviewCoreDto {
  userId: string;
}

export interface ServiceDenyReviewRequestDto {
  reviewRequestId: string;
  userId: string;
}
