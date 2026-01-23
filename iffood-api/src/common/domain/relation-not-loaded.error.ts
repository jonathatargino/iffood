import { DomainError } from './domain-error';

export class RelationNotLoadedError extends DomainError {
  constructor(relationName: string) {
    super(
      `The relation "${relationName}" was not loaded. Please make sure to load the relation before accessing it.`,
    );
  }
}
