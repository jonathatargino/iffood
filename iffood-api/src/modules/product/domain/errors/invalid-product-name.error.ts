import { DomainError } from '../../../../common/domain/domain-error';
import { PRODUCT_CONSTRAINTS } from '../../../../common/validation/constraints/product-constraints';

export class InvalidProductNameError extends DomainError {
  constructor(value: string) {
    super(
      `Invalid product name length: ${value}. Name should be between ${PRODUCT_CONSTRAINTS.NAME_MIN} and ${PRODUCT_CONSTRAINTS.NAME_MAX} characters.`,
    );
  }
}
