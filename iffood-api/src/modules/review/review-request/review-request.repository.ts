import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { ReviewRequest, ReviewRequestStatus } from './review-request.entity';

@Injectable()
export class ReviewRequestRepository {
  constructor(
    @InjectRepository(ReviewRequest)
    private readonly typeormRepository: Repository<ReviewRequest>,
  ) {}

  async findById(id: string): Promise<ReviewRequest | null> {
    return this.typeormRepository.findOne({
      where: { id },
      relations: { orderRequest: { buyer: true } },
    });
  }

  async findByOrderRequestId(
    orderRequestId: string,
  ): Promise<ReviewRequest | null> {
    return this.typeormRepository.findOne({
      where: { orderRequest: { id: orderRequestId } },
      relations: { orderRequest: { buyer: true } },
    });
  }

  async findLatestPendingByBuyerId(
    buyerId: string,
    since: Date,
  ): Promise<ReviewRequest | null> {
    return this.typeormRepository.findOne({
      where: {
        status: ReviewRequestStatus.Pending,
        orderRequest: { buyer: { id: buyerId } },
        createdAt: MoreThanOrEqual(since),
      },
      relations: { orderRequest: { buyer: true, store: true } },
      order: { createdAt: 'DESC' },
    });
  }
}
