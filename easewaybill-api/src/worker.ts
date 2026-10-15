import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: true,
  });

  app.enableShutdownHooks();

  new Logger('WorkerBootstrap').log('EaseWaybill background worker started');
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('WorkerBootstrap');
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);

  logger.error(`Worker startup failed: ${message}`);
  process.exitCode = 1;
});
