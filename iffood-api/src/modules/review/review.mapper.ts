import { Injectable } from '@nestjs/common';
import { Review } from './review.entity';
import { ReviewResponseDto } from './dto/review.response.dto';

@Injectable()
export class ReviewMapper {
  toDto(review: Review): ReviewResponseDto {
    return {
      id: review.id,
      rating: review.rating,
      tags: review.tags,
      description: review.description,
      reviewRequestId: review.reviewRequest?.id,
      createdAt: review.createdAt,
    };
  }
}
