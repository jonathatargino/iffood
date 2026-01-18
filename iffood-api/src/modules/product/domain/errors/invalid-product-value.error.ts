import { DomainError } from '../../../../common/domain/domain-error';
import { PRODUCT_CONSTRAINTS } from '../../../../common/validation/constraints/product-constraints';

export class InvalidProductValueError extends DomainError {
  constructor(value: number) {
    super(
      `Invalid product value: ${value}. Value must be between ${PRODUCT_CONSTRAINTS.VALUE_MIN} and ${PRODUCT_CONSTRAINTS.VALUE_MAX}.`,
    );
  }
}
