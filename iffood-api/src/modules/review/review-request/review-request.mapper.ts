import { Injectable } from '@nestjs/common';
import { ReviewRequest } from './review-request.entity';
import { ReviewRequestResponseDto } from '../dto/review.response.dto';

@Injectable()
export class ReviewRequestMapper {
  toDto(reviewRequest: ReviewRequest): ReviewRequestResponseDto {
    const store = reviewRequest.orderRequest?.store;

    return {
      id: reviewRequest.id,
      status: reviewRequest.status,
      orderRequestId: reviewRequest.orderRequest?.id,
      storeId: store?.id ?? null,
      storeName: store?.name ?? null,
      storePhotoUrl: store?.photoUrl ?? null,
      createdAt: reviewRequest.createdAt,
    };
  }
}
