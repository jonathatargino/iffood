import { DomainError } from '../../../../common/domain/domain-error';

export class InvalidOrderStatusTransitionError extends DomainError {
  constructor(currentStatus: string) {
    super(
      `INVALID_ORDER_STATUS_TRANSITION: cannot transition from ${currentStatus}`,
    );
  }
}
