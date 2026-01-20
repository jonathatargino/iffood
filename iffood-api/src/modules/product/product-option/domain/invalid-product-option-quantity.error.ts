import { DomainError } from '../../../../common/domain/domain-error';
import { PRODUCT_OPTION_CONSTRAINTS } from '../../../../common/validation/constraints/product-option-constraints';

export class InvalidProductOptionQuantityError extends DomainError {
  constructor(value: number) {
    super(
      `Invalid product option quantity: ${value}. Quantity should be between ${PRODUCT_OPTION_CONSTRAINTS.QUANTITY_MIN} and ${PRODUCT_OPTION_CONSTRAINTS.QUANTITY_MAX}.`,
    );
  }
}
