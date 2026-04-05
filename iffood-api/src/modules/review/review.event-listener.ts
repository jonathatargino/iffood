import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReviewRequest } from './review-request/review-request.entity';
import { EventNames } from '../../events/event-names';
import { DataSource } from 'typeorm';

@Injectable()
export class ReviewEventListener {
  constructor(private readonly dataSource: DataSource) {}

  @OnEvent(EventNames.ORDER_REQUEST_ACCEPTED)
  async execute(orderRequestId: string) {
    const reviewRequest = ReviewRequest.create({
      orderRequestId,
    });

    await this.dataSource.getRepository(ReviewRequest).save(reviewRequest);
  }
}
