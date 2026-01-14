import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, tap } from 'rxjs';
import { logger } from '../logger';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;
    const url = req.url;
    const start = Date.now();

    logger.info(`[REQUEST] ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        logger.info(`[SUCCESS] ${method} ${url} - ${duration}ms`);
      }),
      catchError((err) => {
        if (err instanceof Error) {
          const duration = Date.now() - start;
          logger.error(
            `[ERROR] ${method} ${url} - ${duration}ms - Message: ${err.message || 'N/A'} - Status: ${err['status'] || 'N/A'}`,
          );
        }
        throw err;
      }),
    );
  }
}
