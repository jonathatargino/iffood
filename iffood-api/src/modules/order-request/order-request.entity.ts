import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from '../store/store.entity';
import { UserProfile } from '../user-profile/user-profile.entity';
import { OrderRequestItem } from './order-request-item/order-request-item.entity';
import { InvalidOrderStatusTransitionError } from './domain/errors/invalid-order-status-transition.error';
import { ReviewRequest } from '../review/review-request/review-request.entity';

export enum OrderRequestStatus {
  Pending = 'PENDING',
  Concluded = 'CONCLUDED',
  Rejected = 'REJECTED',
  ChangedAndConcluded = 'CHANGED_AND_CONCLUDED',
}

@Unique(['cartId'])
@Entity({ name: 'order_requests' })
export class OrderRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: OrderRequestStatus,
    default: OrderRequestStatus.Pending,
  })
  status: OrderRequestStatus;

  @Column({ name: 'cart_id' })
  cartId: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => UserProfile)
  @JoinColumn({ name: 'buyer_user_id' })
  buyer: UserProfile;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @OneToMany(() => OrderRequestItem, (item) => item.orderRequest, {
    cascade: true,
  })
  items: OrderRequestItem[];

  @OneToMany(
    () => ReviewRequest,
    (reviewRequest) => reviewRequest.orderRequest,
    {
      cascade: true,
    },
  )
  reviewRequests: ReviewRequest[];

  private assertPending(): void {
    if (this.status !== OrderRequestStatus.Pending) {
      throw new InvalidOrderStatusTransitionError(this.status);
    }
  }

  conclude(): void {
    this.assertPending();
    this.status = OrderRequestStatus.Concluded;
  }

  reject(): void {
    this.assertPending();
    this.status = OrderRequestStatus.Rejected;
  }

  changeAndConclude(newItems: OrderRequestItem[]): void {
    this.assertPending();
    this.items = newItems;
    this.status = OrderRequestStatus.ChangedAndConcluded;
  }

  static create(props: {
    cartId: string;
    buyer: UserProfile;
    store: Store;
    items: OrderRequestItem[];
    expiresAt?: Date | null;
  }): OrderRequest {
    const order = new OrderRequest();
    order.cartId = props.cartId;
    order.buyer = props.buyer;
    order.store = props.store;
    order.items = props.items;
    order.status = OrderRequestStatus.Pending;
    order.expiresAt = props.expiresAt ?? null;
    return order;
  }
}
