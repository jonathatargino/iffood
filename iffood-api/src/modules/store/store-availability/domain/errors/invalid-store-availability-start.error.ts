import { DomainError } from '../../../../../common/domain/domain-error';
import { STORE_AVAILABILITY_CONSTRAINTS } from '../../../../../common/validation/constraints/store-availability-constraints';

export class InvalidStoreAvailabilityStartError extends DomainError {
  constructor(value: string) {
    super(
      `Invalid store availability start time: ${value}. Start time should have a length of ${STORE_AVAILABILITY_CONSTRAINTS.START_LENGTH}.`,
    );
  }
}
