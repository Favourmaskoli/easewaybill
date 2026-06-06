import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);

    const { method, url } = req;
    const userAgent = req.get('user-agent') ?? '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = res;
          const elapsed = Date.now() - startTime;
          this.logger.log(
            `${method} ${url} ${statusCode} — ${elapsed}ms [${userAgent}] [reqId: ${requestId}]`,
          );
        },
        error: (err: Error) => {
          const elapsed = Date.now() - startTime;
          this.logger.error(
            `${method} ${url} ERROR — ${elapsed}ms [reqId: ${requestId}]`,
            err.stack,
          );
        },
      }),
    );
  }
}
