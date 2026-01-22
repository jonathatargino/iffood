import { InvalidAvailabilityHoursError } from '../errors/invalid-availability-hours.error';
import { MilitaryTime } from './military-time.vo';

export class AvailabilityHours {
  private readonly _start: MilitaryTime;
  private readonly _end: MilitaryTime;

  constructor(start: string, end: string) {
    const militaryTimeStart = new MilitaryTime(start);
    const militaryTimeEnd = new MilitaryTime(end);

    this.validate(militaryTimeStart, militaryTimeEnd);
    this._start = militaryTimeStart;
    this._end = militaryTimeEnd;
  }

  getStart(): string {
    return this._start.getValue();
  }

  getEnd(): string {
    return this._end.getValue();
  }

  private validate(start: MilitaryTime, end: MilitaryTime): void {
    if (start.getValue() >= end.getValue()) {
      throw new InvalidAvailabilityHoursError(start.getValue(), end.getValue());
    }
  }
}
