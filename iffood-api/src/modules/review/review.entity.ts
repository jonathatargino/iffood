import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReviewRequest } from './review-request/review-request.entity';
import { InvalidRatingError } from './domain/errors/invalid-rating.error';

@Entity({ name: 'reviews' })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'json', default: '[]' })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @OneToOne(() => ReviewRequest)
  @JoinColumn({ name: 'review_request_id' })
  reviewRequest: ReviewRequest;

  private static validateRating(rating: number): void {
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      throw new InvalidRatingError(rating);
    }
  }

  static create(props: {
    rating: number;
    tags?: string[];
    description?: string | null;
    reviewRequest: ReviewRequest;
  }): Review {
    Review.validateRating(props.rating);

    const review = new Review();
    review.rating = props.rating;
    review.tags = props.tags ?? [];
    review.description = props.description ?? null;
    review.reviewRequest = props.reviewRequest;
    return review;
  }
}
