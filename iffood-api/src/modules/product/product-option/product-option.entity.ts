import { Check, Entity, JoinColumn, ManyToOne } from 'typeorm';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../product.entity';
import { applyPatch } from '../../../common/domain/apply-patch';
import { PRODUCT_OPTION_CONSTRAINTS } from '../../../common/validation/constraints/product-option-constraints';
import { InvalidProductOptionNameError } from './domain/invalid-product-option-name.error';
import { InvalidProductOptionQuantityError } from './domain/invalid-product-option-quantity.error';

@Check(
  `"quantity" >= ${PRODUCT_OPTION_CONSTRAINTS.QUANTITY_MIN} AND "quantity" <= ${PRODUCT_OPTION_CONSTRAINTS.QUANTITY_MAX}`,
)
@Check(`LENGTH("name") >= ${PRODUCT_OPTION_CONSTRAINTS.NAME_MIN}`)
@Entity({
  name: 'product_options',
})
export class ProductOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quantity' })
  private _quantity: number;

  @Column({
    length: PRODUCT_OPTION_CONSTRAINTS.NAME_MAX,
    name: 'name',
  })
  private _name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => Product, (product) => product.productOptions)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  get name(): string {
    return this._name;
  }

  changeName(name: string): void {
    if (
      name.length < PRODUCT_OPTION_CONSTRAINTS.NAME_MIN ||
      name.length > PRODUCT_OPTION_CONSTRAINTS.NAME_MAX
    ) {
      throw new InvalidProductOptionNameError(name);
    }

    this._name = name;
  }

  get quantity(): number {
    return this._quantity;
  }

  changeQuantity(quantity: number): void {
    if (
      quantity < PRODUCT_OPTION_CONSTRAINTS.QUANTITY_MIN ||
      quantity > PRODUCT_OPTION_CONSTRAINTS.QUANTITY_MAX
    ) {
      throw new InvalidProductOptionQuantityError(quantity);
    }

    this._quantity = quantity;
  }

  patch(data: Pick<Partial<ProductOption>, 'name' | 'quantity'>) {
    applyPatch<string>({
      fieldName: 'name',
      value: data.name,
      set: (value) => this.changeName(value),
      allowNull: false,
    });

    applyPatch<number>({
      fieldName: 'quantity',
      value: data.quantity,
      set: (value) => this.changeQuantity(value),
      allowNull: false,
    });
  }

  static create({
    name,
    quantity,
    product,
  }: {
    name: string;
    quantity: number;
    product: Product;
  }): ProductOption {
    const productOption = new ProductOption();

    productOption.changeName(name);
    productOption.changeQuantity(quantity);
    productOption.product = product;

    return productOption;
  }
}
