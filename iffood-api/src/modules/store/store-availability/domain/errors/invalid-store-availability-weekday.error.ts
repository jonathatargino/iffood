import { DomainError } from '../../../../../common/domain/domain-error';
import { STORE_AVAILABILITY_CONSTRAINTS } from '../../../../../common/validation/constraints/store-availability-constraints';

export class InvalidStoreAvailabilityWeekdayError extends DomainError {
  constructor(value: number) {
    super(
      `Invalid store availability weekday: ${value}. Weekday should be between ${STORE_AVAILABILITY_CONSTRAINTS.WEEKDAY_MIN} and ${STORE_AVAILABILITY_CONSTRAINTS.WEEKDAY_MAX}.`,
    );
  }
}
