import { STORE_AVAILABILITY_CONSTRAINTS } from '../../../../../common/validation/constraints/store-availability-constraints';
import { InvalidStoreAvailabilityWeekdayError } from '../errors/invalid-store-availability-weekday.error';

export class WeekDay {
  private _value: number;

  constructor(value: number) {
    this.validate(value);
    this._value = value;
  }

  getValue(): number {
    return this._value;
  }

  private validate(value: number): void {
    if (
      value < STORE_AVAILABILITY_CONSTRAINTS.WEEKDAY_MIN ||
      value > STORE_AVAILABILITY_CONSTRAINTS.WEEKDAY_MAX
    ) {
      throw new InvalidStoreAvailabilityWeekdayError(value);
    }
  }
}
