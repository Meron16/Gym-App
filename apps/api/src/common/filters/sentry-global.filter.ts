import { Catch, ArgumentsHost } from '@nestjs/common';
import type { HttpServer } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

/** Captures unhandled errors to Sentry before delegating to Nest default handling. */
@Catch()
export class SentryGlobalFilter extends BaseExceptionFilter {
  constructor(httpAdapter: HttpServer) {
    super(httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(exception);
    }
    super.catch(exception, host);
  }
}
