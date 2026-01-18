import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../product.entity';
import { applyPatch } from '../../../common/domain/apply-patch';

@Entity({
  name: 'product_options',
})
export class ProductOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quantity: number;

  @Column()
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => Product, (product) => product.productOptions)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  patch(data: Pick<Partial<ProductOption>, 'name' | 'quantity'>) {
    applyPatch<string>({
      fieldName: 'name',
      value: data.name,
      set: (value) => (this.name = <string>value),
      allowNull: false,
    });

    applyPatch<number>({
      fieldName: 'quantity',
      value: data.quantity,
      set: (value) => (this.quantity = <number>value),
      allowNull: false,
    });
  }
}
