import { InvalidMilitaryTimeError } from '../errors/invalid-military-time.error';

export class MilitaryTime {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  getValue(): string {
    return this._value;
  }

  private validate(value: string): void {
    const militaryTimeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!militaryTimeRegex.test(value)) {
      throw new InvalidMilitaryTimeError(value);
    }
  }
}
