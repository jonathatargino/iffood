import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { finalize, Observable } from 'rxjs';
import { beginDbProcessing } from '../db/db-processing.context';

export const PROCESSING_TIME_HEADER = 'x-processing-ms';

@Injectable()
export class ProcessingTimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const res = context.switchToHttp().getResponse<Response>();
    const store = beginDbProcessing();

    return next.handle().pipe(
      finalize(() => {
        const ms = Math.round(store.totalMs);
        res.setHeader(PROCESSING_TIME_HEADER, String(ms));
      }),
    );
  }
}
