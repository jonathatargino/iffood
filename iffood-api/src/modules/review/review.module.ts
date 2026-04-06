import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { ReviewRequest } from './review-request/review-request.entity';
import { ReviewResume } from './review-resume/review-resume.entity';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewRepository } from './review.repository';
import { ReviewRequestRepository } from './review-request/review-request.repository';
import { ReviewResumeRepository } from './review-resume/review-resume.repository';
import { ReviewResumeService } from './review-resume/review-resume.service';
import { ReviewMapper } from './review.mapper';
import { ReviewRequestMapper } from './review-request/review-request.mapper';
import { AuthModule } from '../auth/auth.module';
import { ReviewEventListener } from './review.event-listener';
import { LlmModule } from '../../infra/llm/llm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, ReviewRequest, ReviewResume]),
    AuthModule,
    LlmModule,
  ],
  controllers: [ReviewController],
  exports: [ReviewMapper, ReviewResumeService],
  providers: [
    ReviewService,
    ReviewRepository,
    ReviewRequestRepository,
    ReviewResumeRepository,
    ReviewResumeService,
    ReviewMapper,
    ReviewRequestMapper,
    ReviewEventListener,
  ],
})
export class ReviewModule {}
