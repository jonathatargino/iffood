import { DomainError } from '../../../../../common/domain/domain-error';

export class DuplicatedAvailabilityWeekdayError extends DomainError {
  constructor(weekday: number) {
    super(
      `Duplicated availability weekday: an availability for weekday ${weekday} already exists.`,
    );
  }
}
