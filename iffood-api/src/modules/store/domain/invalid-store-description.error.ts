import { DomainError } from '../../../common/domain/domain-error';
import { STORE_CONSTRAINTS } from '../../../common/validation/constraints/store-constraints';

export class InvalidStoreDescriptionError extends DomainError {
  constructor(value: string) {
    super(
      `Invalid store description: ${value}. Description should have a length between ${STORE_CONSTRAINTS.DESCRIPTION_MIN} and ${STORE_CONSTRAINTS.DESCRIPTION_MAX}.`,
    );
  }
}
