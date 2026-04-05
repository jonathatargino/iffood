import { Injectable } from '@nestjs/common';
import { ReviewRequest } from './review-request.entity';
import { ReviewRequestResponseDto } from '../dto/review.response.dto';

@Injectable()
export class ReviewRequestMapper {
  toDto(reviewRequest: ReviewRequest): ReviewRequestResponseDto {
    return {
      id: reviewRequest.id,
      status: reviewRequest.status,
      orderRequestId: reviewRequest.orderRequest?.id,
      createdAt: reviewRequest.createdAt,
    };
  }
}
