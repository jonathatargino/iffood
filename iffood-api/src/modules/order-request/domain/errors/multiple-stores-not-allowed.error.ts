import { DomainError } from '../../../../common/domain/domain-error';

export class MultipleStoresNotAllowedError extends DomainError {
  constructor() {
    super('MULTIPLE_STORES_NOT_ALLOWED');
  }
}
