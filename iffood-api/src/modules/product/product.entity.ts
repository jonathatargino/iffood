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
  private _value: number;

  @Column({ name: 'name', length: PRODUCT_CONSTRAINTS.NAME_MAX })
  private _name: string;

  @Column({ name: 'description', length: PRODUCT_CONSTRAINTS.DESCRIPTION_MAX })
  private _description: string;

  @Column({ name: 'photo_url', length: PRODUCT_CONSTRAINTS.PHOTO_URL_MAX })
  private _photoUrl: string;

  @Column({ type: 'enum', enum: ProductCategory })
  category: ProductCategory;

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

  get name(): string {
    return this._name;
  }

  changeName(name: string): void {
    if (
      name.length < PRODUCT_CONSTRAINTS.NAME_MIN ||
      name.length > PRODUCT_CONSTRAINTS.NAME_MAX
    ) {
      throw new InvalidProductNameError(name);
    }

    this._name = name;
  }

  get description(): string {
    return this._description;
  }

  changeDescription(description: string): void {
    if (
      description.length < PRODUCT_CONSTRAINTS.DESCRIPTION_MIN ||
      description.length > PRODUCT_CONSTRAINTS.DESCRIPTION_MAX
    ) {
      throw new InvalidProductDescriptionError(description);
    }

    this._description = description;
  }

  get photoUrl(): string {
    return this._photoUrl;
  }

  changePhotoUrl(photoUrl: string): void {
    let url: string;
    try {
      url = new URL(photoUrl).toString();
    } catch {
      throw new InvalidProductPhotoUrlError(photoUrl);
    }

    if (
      url.length < PRODUCT_CONSTRAINTS.PHOTO_URL_MIN ||
      url.length > PRODUCT_CONSTRAINTS.PHOTO_URL_MAX
    ) {
      throw new InvalidProductPhotoUrlError(photoUrl);
    }

    this._photoUrl = url;
  }

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

  static create(props: {
    name: string;
    description: string;
    photoUrl: string;
    value: number;
    category: ProductCategory;
  }): Product {
    const product = new Product();

    product.changeName(props.name);
    product.changeDescription(props.description);
    product.changePhotoUrl(props.photoUrl);
    product.changeValue(props.value);
    product.category = props.category;

    return product;
  }
}
