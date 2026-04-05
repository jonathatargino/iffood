import { DomainError } from '../../../../common/domain/domain-error';

export class ReviewRequestNotPendingError extends DomainError {
  constructor(reviewRequestId: string) {
    super(
      `REVIEW_REQUEST_NOT_PENDING: review request ${reviewRequestId} is not pending`,
    );
  }
}
