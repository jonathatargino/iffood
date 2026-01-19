import { UnprocessableEntityException } from '@nestjs/common';
import { logger } from '../common/logger';

export function parseJson<T>(value: unknown): T {
  if (typeof value !== 'string') {
    throw new UnprocessableEntityException('Can only parse strings to JSON');
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error(error);
    throw new UnprocessableEntityException('Could not parse string to JSON');
  }
}
