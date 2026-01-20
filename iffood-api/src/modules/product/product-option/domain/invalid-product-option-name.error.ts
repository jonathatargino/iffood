import { DomainError } from '../../../../common/domain/domain-error';
import { PRODUCT_OPTION_CONSTRAINTS } from '../../../../common/validation/constraints/product-option-constraints';

export class InvalidProductOptionNameError extends DomainError {
  constructor(value: string) {
    super(
      `Invalid product option name length: ${value}. Name should be between ${PRODUCT_OPTION_CONSTRAINTS.NAME_MIN} and ${PRODUCT_OPTION_CONSTRAINTS.NAME_MAX} characters.`,
    );
  }
}
