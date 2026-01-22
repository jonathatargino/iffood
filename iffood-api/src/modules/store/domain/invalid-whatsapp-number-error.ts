import { DomainError } from '../../../common/domain/domain-error';

export class InvalidWhatsappNumberError extends DomainError {
  constructor(value: string) {
    super(
      `Invalid WhatsApp number: ${value}. It should match the format {DDD}9XXXXXXXX.`,
    );
  }
}
