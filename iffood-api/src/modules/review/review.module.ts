import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { ReviewRequest } from './review-request/review-request.entity';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewRepository } from './review.repository';
import { ReviewRequestRepository } from './review-request/review-request.repository';
import { ReviewMapper } from './review.mapper';
import { ReviewRequestMapper } from './review-request/review-request.mapper';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Review, ReviewRequest]), AuthModule],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    ReviewRepository,
    ReviewRequestRepository,
    ReviewMapper,
    ReviewRequestMapper,
  ],
})
export class ReviewModule {}
