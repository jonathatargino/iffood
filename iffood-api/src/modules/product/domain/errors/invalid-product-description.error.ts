import { DomainError } from '../../../../common/domain/domain-error';
import { PRODUCT_CONSTRAINTS } from '../../../../common/validation/constraints/product-constraints';

export class InvalidProductDescriptionError extends DomainError {
  constructor(value: string) {
    super(
      `Invalid product description length: ${value}. Description should be between ${PRODUCT_CONSTRAINTS.DESCRIPTION_MIN} and ${PRODUCT_CONSTRAINTS.DESCRIPTION_MAX} characters.`,
    );
  }
}
