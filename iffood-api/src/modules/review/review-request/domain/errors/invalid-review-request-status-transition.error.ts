import { DomainError } from '../../../../../common/domain/domain-error';

export class InvalidReviewRequestStatusTransitionError extends DomainError {
  constructor(currentStatus: string) {
    super(
      `INVALID_REVIEW_REQUEST_STATUS_TRANSITION: cannot transition from ${currentStatus}`,
    );
  }
}
