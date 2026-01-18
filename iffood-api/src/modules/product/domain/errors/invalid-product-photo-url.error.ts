import { DomainError } from '../../../../common/domain/domain-error';
import { PRODUCT_CONSTRAINTS } from '../../../../common/validation/constraints/product-constraints';

export class InvalidProductPhotoUrlError extends DomainError {
  constructor(value: string) {
    super(
      `Invalid product photo URL length: ${value}. Photo URL should be between ${PRODUCT_CONSTRAINTS.PHOTO_URL_MIN} and ${PRODUCT_CONSTRAINTS.PHOTO_URL_MAX} characters.`,
    );
  }
}
