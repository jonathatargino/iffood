import { Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductOption } from './product-option/product-option.entity';
import { Store } from '../store/store.entity';
import { applyPatch } from '../../common/domain/apply-patch';

export enum ProductCategory {
  Sweet = 'sweet',
  Savory = 'savory',
}

type UpdateProductDetailsInput = Partial<
  Pick<Product, 'photoUrl' | 'category' | 'name' | 'description' | 'value'>
>;

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

  @Column({ type: 'enum', enum: ProductCategory })
  category: ProductCategory;

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

  updateDetails({
    category,
    description,
    name,
    photoUrl,
    value,
  }: UpdateProductDetailsInput) {
    applyPatch<string>({
      fieldName: 'photoUrl',
      value: photoUrl,
      allowNull: false,
      set: (v) => (this.photoUrl = <string>v),
    });
    applyPatch<ProductCategory>({
      fieldName: 'category',
      value: category,
      allowNull: false,
      set: (v) => (this.category = <ProductCategory>v),
    });
    applyPatch<string>({
      fieldName: 'name',
      value: name,
      allowNull: false,
      set: (v) => (this.name = <string>v),
    });
    applyPatch<string>({
      fieldName: 'description',
      value: description,
      allowNull: false,
      set: (v) => (this.description = <string>v),
    });
    applyPatch<number>({
      fieldName: 'value',
      value: value,
      allowNull: false,
      set: (v) => (this.value = <number>v),
    });
  }
}
