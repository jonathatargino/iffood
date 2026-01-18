import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { logger } from '../logger';

@Catch()
export class GeneralExceptionsFilter extends BaseExceptionFilter {
  constructor(readonly httpAdapterHost: HttpAdapterHost) {
    super(httpAdapterHost.httpAdapter);
  }

  override catch(exception: unknown, host: ArgumentsHost) {
    logger.error(exception);
    super.catch(exception, host);
  }
}
