import { DomainError } from '../../../common/domain/domain-error';
import { STORE_CONSTRAINTS } from '../../../common/validation/constraints/store-constraints';

export class InvalidStoreWhatsappError extends DomainError {
  constructor(value: string) {
    super(
      `Invalid store WhatsApp: ${value}. WhatsApp should have a length equal to ${STORE_CONSTRAINTS.WHATSAPP_LENGTH}.`,
    );
  }
}
