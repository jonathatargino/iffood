import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { logger } from '../logger';
import { Request, Response } from 'express';
import { DomainError } from '../domain/domain-error';

@Catch()
export class GeneralExceptionsFilter extends BaseExceptionFilter {
  constructor(readonly httpAdapterHost: HttpAdapterHost) {
    super(httpAdapterHost.httpAdapter);
  }

  override catch(exception: unknown, host: ArgumentsHost) {
    logger.error(exception);

    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    if (exception instanceof DomainError) {
      const statusCode = HttpStatus.BAD_REQUEST;

      httpAdapter.reply(
        response,
        {
          statusCode,
          message: exception.message,
          path: String(httpAdapter.getRequestUrl(request)),
          timestamp: new Date().toISOString(),
        },
        statusCode,
      );
      return;
    }

    super.catch(exception, host);
  }
}
