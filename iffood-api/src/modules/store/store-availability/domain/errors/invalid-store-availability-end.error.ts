import { DomainError } from '../../../../../common/domain/domain-error';
import { STORE_AVAILABILITY_CONSTRAINTS } from '../../../../../common/validation/constraints/store-availability-constraints';

export class InvalidStoreAvailabilityEndError extends DomainError {
  constructor(value: string) {
    super(
      `Invalid store availability end time: ${value}. End time should have a length of ${STORE_AVAILABILITY_CONSTRAINTS.END_LENGTH}.`,
    );
  }
}
