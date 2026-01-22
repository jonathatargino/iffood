import { DomainError } from '../../../../../common/domain/domain-error';

export class InvalidAvailabilityHoursError extends DomainError {
  constructor(start: string, end: string) {
    super(
      `Invalid availability hours: start time ${start} must be earlier than end time ${end}.`,
    );
  }
}
