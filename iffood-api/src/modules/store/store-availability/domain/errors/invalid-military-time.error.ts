import { DomainError } from '../../../../../common/domain/domain-error';

export class InvalidMilitaryTimeError extends DomainError {
  constructor(value: string) {
    super(
      `Invalid military time: ${value}. Time should be in the format HH:mm.`,
    );
  }
}
