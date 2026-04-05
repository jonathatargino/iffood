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
import { OrderRequest } from '../../order-request/order-request.entity';
import { InvalidReviewRequestStatusTransitionError } from './domain/errors/invalid-review-request-status-transition.error';

export enum ReviewRequestStatus {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
  Denied = 'DENIED',
}

@Entity({ name: 'review_requests' })
export class ReviewRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ReviewRequestStatus,
    default: ReviewRequestStatus.Pending,
  })
  status: ReviewRequestStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @OneToOne(() => OrderRequest)
  @JoinColumn({ name: 'order_request_id' })
  orderRequest: OrderRequest;

  private assertPending(): void {
    if (this.status !== ReviewRequestStatus.Pending) {
      throw new InvalidReviewRequestStatusTransitionError(this.status);
    }
  }

  accept(): void {
    this.assertPending();
    this.status = ReviewRequestStatus.Accepted;
  }

  deny(): void {
    this.assertPending();
    this.status = ReviewRequestStatus.Denied;
  }

  static create(props: { orderRequestId: string }): ReviewRequest {
    const reviewRequest = new ReviewRequest();
    reviewRequest.orderRequest = { id: props.orderRequestId } as OrderRequest;
    reviewRequest.status = ReviewRequestStatus.Pending;
    return reviewRequest;
  }
}
