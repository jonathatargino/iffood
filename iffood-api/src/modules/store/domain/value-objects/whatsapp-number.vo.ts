import { InvalidWhatsappNumberError } from '../invalid-whatsapp-number-error';

export class WhatsappNumber {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  getValue(): string {
    return this._value;
  }

  private validate(value: string): void {
    const whatsappRegex = /^\d{2}9\d{8}$/;

    if (!whatsappRegex.test(value)) {
      throw new InvalidWhatsappNumberError(value);
    }
  }
}
