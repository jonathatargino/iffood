import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Review } from './review.entity';
import { ReviewRequest } from './review-request/review-request.entity';
import { ReviewRequestRepository } from './review-request/review-request.repository';
import {
  ServiceCreateReviewDto,
  ServiceDenyReviewRequestDto,
} from './dto/review.service.dto';

@Injectable()
export class ReviewService {
  constructor(
    private readonly reviewRequestRepository: ReviewRequestRepository,
    private readonly dataSource: DataSource,
  ) {}

  async createReview(dto: ServiceCreateReviewDto): Promise<Review> {
    const reviewRequest = await this.findReviewRequestForUser(
      dto.reviewRequestId,
      dto.userId,
    );

    return this.dataSource.transaction(async (em) => {
      reviewRequest.accept();
      await em.save(ReviewRequest, reviewRequest);

      const review = Review.create({
        rating: dto.rating,
        tags: dto.tags,
        description: dto.description,
        reviewRequest,
      });

      return em.save(Review, review);
    });
  }

  async denyReviewRequest(dto: ServiceDenyReviewRequestDto): Promise<void> {
    const reviewRequest = await this.findReviewRequestForUser(
      dto.reviewRequestId,
      dto.userId,
    );

    reviewRequest.deny();
    await this.dataSource.getRepository(ReviewRequest).save(reviewRequest);
  }

  async findLatestForUser(userId: string): Promise<ReviewRequest> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const reviewRequest =
      await this.reviewRequestRepository.findLatestPendingByBuyerId(
        userId,
        sevenDaysAgo,
      );

    if (!reviewRequest) {
      throw new NotFoundException('No pending review request found');
    }

    return reviewRequest;
  }

  private async findReviewRequestForUser(
    reviewRequestId: string,
    userId: string,
  ): Promise<ReviewRequest> {
    const reviewRequest =
      await this.reviewRequestRepository.findById(reviewRequestId);

    if (!reviewRequest) {
      throw new NotFoundException(
        `Review request ${reviewRequestId} not found`,
      );
    }

    if (reviewRequest.orderRequest.buyer.id !== userId) {
      throw new ForbiddenException();
    }

    return reviewRequest;
  }
}
