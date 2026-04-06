import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { ReviewResume } from './review-resume.entity';

@Injectable()
export class ReviewResumeRepository {
  constructor(
    @InjectRepository(ReviewResume)
    private readonly typeormRepository: Repository<ReviewResume>,
  ) {}

  async findLatestByStoreId(
    storeId: string,
    since: Date,
  ): Promise<ReviewResume | null> {
    return this.typeormRepository.findOne({
      where: {
        store: { id: storeId },
        createdAt: MoreThanOrEqual(since),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async save(reviewResume: ReviewResume): Promise<ReviewResume> {
    return this.typeormRepository.save(reviewResume);
  }
}
