import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';

@Injectable()
export class ReviewRepository {
  constructor(
    @InjectRepository(Review)
    private readonly typeormRepository: Repository<Review>,
  ) {}

  async findByReviewRequestId(reviewRequestId: string): Promise<Review | null> {
    return this.typeormRepository.findOne({
      where: { reviewRequest: { id: reviewRequestId } },
      relations: { reviewRequest: true },
    });
  }

  async findById(id: string): Promise<Review | null> {
    return this.typeormRepository.findOne({
      where: { id },
      relations: { reviewRequest: { orderRequest: true } },
    });
  }
}
