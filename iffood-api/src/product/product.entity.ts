import { Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductOption } from '../product-option/product-option.entity';
import { Store } from '../store/store.entity';

@Entity({
  name: 'products',
})
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  value: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ name: 'photo_url' })
  photoUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => ProductOption, (productOption) => productOption.product, {
    cascade: ['insert', 'update', 'soft-remove'],
  })
  productOptions: ProductOption[];

  @ManyToOne(() => Store, (store) => store.products)
  @JoinColumn({ name: 'store_id' })
  store: Store;
}
