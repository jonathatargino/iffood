import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { UserId } from '../../common/decorators/user-id';
import { ReviewService } from './review.service';
import { ReviewMapper } from './review.mapper';
import { ReviewRequestMapper } from './review-request/review-request.mapper';
import { CreateReviewRequestDto } from './dto/review.request.dto';
import {
  ReviewResponseDto,
  ReviewRequestResponseDto,
} from './dto/review.response.dto';

@Controller('review')
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly reviewMapper: ReviewMapper,
    private readonly reviewRequestMapper: ReviewRequestMapper,
  ) {}

  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: ReviewRequestResponseDto })
  @Get('request/latest')
  @UseGuards(AuthGuard)
  async findLatestReviewRequest(@UserId() userId: string) {
    const reviewRequest = await this.reviewService.findLatestForUser(userId);
    return this.reviewRequestMapper.toDto(reviewRequest);
  }

  @ApiBearerAuth('access-token')
  @ApiResponse({ type: ReviewResponseDto })
  @Post()
  @UseGuards(AuthGuard)
  async createReview(
    @Body() body: CreateReviewRequestDto,
    @UserId() userId: string,
  ) {
    const review = await this.reviewService.createReview({
      reviewRequestId: body.reviewRequestId,
      rating: body.rating,
      tags: body.tags,
      description: body.description,
      userId,
    });

    return this.reviewMapper.toDto(review);
  }

  @ApiBearerAuth('access-token')
  @ApiOkResponse()
  @Patch('request/:id/deny')
  @UseGuards(AuthGuard)
  async denyReviewRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @UserId() userId: string,
  ) {
    await this.reviewService.denyReviewRequest({
      reviewRequestId: id,
      userId,
    });
  }
}
