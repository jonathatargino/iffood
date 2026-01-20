import { Check, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
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
import { InvalidProductValueError } from './domain/errors/invalid-product-value.error';
import { PRODUCT_CONSTRAINTS } from '../../common/validation/constraints/product-constraints';
import { InvalidProductNameError } from './domain/errors/invalid-product-name.error';
import { InvalidProductDescriptionError } from './domain/errors/invalid-product-description.error';
import { InvalidProductPhotoUrlError } from './domain/errors/invalid-product-photo-url.error';

export enum ProductCategory {
  Sweet = 'sweet',
  Savory = 'savory',
}

type UpdateProductDetailsInput = Partial<
  Pick<Product, 'photoUrl' | 'category' | 'name' | 'description' | 'value'>
>;

@Check(
  `"value" >= ${PRODUCT_CONSTRAINTS.VALUE_MIN} AND "value" <= ${PRODUCT_CONSTRAINTS.VALUE_MAX}`,
)
@Check(`LENGTH("name") >= ${PRODUCT_CONSTRAINTS.NAME_MIN}`)
@Check(`LENGTH("description") >= ${PRODUCT_CONSTRAINTS.DESCRIPTION_MIN}`)
@Entity({
  name: 'products',
})
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'value' })
  _value: number;

  get value(): number {
    return this._value;
  }

  changeValue(val: number): void {
    if (
      val < PRODUCT_CONSTRAINTS.VALUE_MIN ||
      val > PRODUCT_CONSTRAINTS.VALUE_MAX
    ) {
      throw new InvalidProductValueError(val);
    }

    this._value = val;
  }

  @Column({ name: 'name', length: PRODUCT_CONSTRAINTS.NAME_MAX })
  _name: string;

  get name(): string {
    return this._name;
  }

  changeName(name: string): void {
    const trimmedName = name.trim();
    if (
      trimmedName.length < PRODUCT_CONSTRAINTS.NAME_MIN ||
      trimmedName.length > PRODUCT_CONSTRAINTS.NAME_MAX
    ) {
      throw new InvalidProductNameError(name);
    }

    this._name = trimmedName;
  }

  @Column({ name: 'description', length: PRODUCT_CONSTRAINTS.DESCRIPTION_MAX })
  _description: string;

  get description(): string {
    return this._description;
  }

  changeDescription(description: string): void {
    const trimmedDescription = description.trim();
    if (
      trimmedDescription.length < PRODUCT_CONSTRAINTS.DESCRIPTION_MIN ||
      trimmedDescription.length > PRODUCT_CONSTRAINTS.DESCRIPTION_MAX
    ) {
      throw new InvalidProductDescriptionError(description);
    }

    this._description = trimmedDescription;
  }

  @Column({ type: 'enum', enum: ProductCategory })
  category: ProductCategory;

  @Column({ name: 'photo_url', length: PRODUCT_CONSTRAINTS.PHOTO_URL_MAX })
  _photoUrl: string;

  get photoUrl(): string {
    return this._photoUrl;
  }

  changePhotoUrl(photoUrl: string): void {
    const trimmedPhotoUrl = photoUrl.trim();
    if (
      trimmedPhotoUrl.length < PRODUCT_CONSTRAINTS.PHOTO_URL_MIN ||
      trimmedPhotoUrl.length > PRODUCT_CONSTRAINTS.PHOTO_URL_MAX
    ) {
      throw new InvalidProductPhotoUrlError(photoUrl);
    }

    this._photoUrl = trimmedPhotoUrl;
  }

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
      set: (v) => this.changePhotoUrl(v),
    });
    applyPatch<string>({
      fieldName: 'name',
      value: name,
      allowNull: false,
      set: (v) => this.changeName(v),
    });
    applyPatch<string>({
      fieldName: 'description',
      value: description,
      allowNull: false,
      set: (v) => this.changeDescription(v),
    });
    applyPatch<number>({
      fieldName: 'value',
      value: value,
      allowNull: false,
      set: (v) => this.changeValue(v),
    });
    applyPatch<ProductCategory>({
      fieldName: 'category',
      value: category,
      allowNull: false,
      set: (v) => (this.category = v),
    });
  }
}
