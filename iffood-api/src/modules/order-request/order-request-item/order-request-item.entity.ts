import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderRequest } from '../order-request.entity';
import { Product } from '../../product/product.entity';
import { ProductOption } from '../../product/product-option/product-option.entity';

@Entity({ name: 'order_request_items' })
export class OrderRequestItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quantity: number;

  @Column({ name: 'product_name' })
  productName: string;

  @Column({ name: 'product_value' })
  productValue: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => OrderRequest, (order) => order.items)
  @JoinColumn({ name: 'order_request_id' })
  orderRequest: OrderRequest;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ProductOption)
  @JoinColumn({ name: 'product_option_id' })
  productOption: ProductOption;

  static create(props: {
    quantity: number;
    productName: string;
    productValue: number;
    product: Product;
    productOption: ProductOption;
    orderRequest?: OrderRequest;
  }): OrderRequestItem {
    const item = new OrderRequestItem();
    item.quantity = props.quantity;
    item.productName = props.productName;
    item.productValue = props.productValue;
    item.product = props.product;
    item.productOption = props.productOption;
    if (props.orderRequest) item.orderRequest = props.orderRequest;
    return item;
  }
}
