import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { finalize, Observable } from 'rxjs';
import {
  getDbProcessingMs,
  runWithDbProcessingContext,
} from '../db/db-processing.context';

export const PROCESSING_TIME_HEADER = 'X-Processing-Ms';

@Injectable()
export class ProcessingTimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const res = context.switchToHttp().getResponse<Response>();

    return runWithDbProcessingContext(() =>
      next.handle().pipe(
        finalize(() => {
          const ms = Math.round(getDbProcessingMs());
          res.setHeader(PROCESSING_TIME_HEADER, String(ms));
        }),
      ),
    );
  }
}
