import { DomainError } from '../../../common/domain/domain-error';
import { STORE_CONSTRAINTS } from '../../../common/validation/constraints/store-constraints';

export class InvalidStoreNameError extends DomainError {
  constructor(value: string) {
    super(
      `Invalid store name: ${value}. Name should have a length between ${STORE_CONSTRAINTS.NAME_MIN} and ${STORE_CONSTRAINTS.NAME_MAX}.`,
    );
  }
}
