import { DomainError } from '../../../../common/domain/domain-error';

export class InvalidRatingError extends DomainError {
  constructor(rating: number) {
    super(`INVALID_RATING: rating must be between 0 and 5, got ${rating}`);
  }
}
