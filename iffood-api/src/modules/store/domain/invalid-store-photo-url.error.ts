import { DomainError } from '../../../common/domain/domain-error';
import { STORE_CONSTRAINTS } from '../../../common/validation/constraints/store-constraints';

export class InvalidStorePhotoUrlError extends DomainError {
  constructor(value: string) {
    super(
      `Invalid store photo URL: ${value}. Photo URL should have a length less than ${STORE_CONSTRAINTS.PHOTO_URL_MAX}.`,
    );
  }
}
