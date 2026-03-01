import { DomainError } from '../../../../common/domain/domain-error';

export class OutOfStockError extends DomainError {
  constructor(productOptionId: string, requested: number, available: number) {
    super(
      `OUT_OF_STOCK: product option ${productOptionId} has ${available} available but ${requested} were requested`,
    );
  }
}
