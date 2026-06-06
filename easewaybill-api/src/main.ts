import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true, // for webhook signature verification
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 3000;
  const apiPrefix = config.get<string>('app.apiPrefix') ?? 'api/v1';
  const isProduction = config.get<boolean>('app.isProduction') ?? false;
  const corsOrigins = config.get<string[]>('cors.origins') ?? [];

  app.use(
    helmet({
      contentSecurityPolicy: isProduction,
      crossOriginEmbedderPolicy: isProduction,
    }),
  );

  app.enableCors({
    origin: isProduction ? corsOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    credentials: true,
  });

  app.use(compression());

  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health'],
  });

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('EaseWaybill API')
      .setDescription('Escrow-based delivery payment platform API')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addTag('auth', 'Authentication & authorization')
      .addTag('users', 'User management')
      .addTag('orders', 'Order lifecycle')
      .addTag('escrow', 'Escrow & payment flows')
      .addTag('delivery', 'Delivery tracking')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
      },
    });

    logger.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  }

  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(`🚀 EaseWaybill API: http://localhost:${port}/${apiPrefix}`);
  logger.log(`🌍 Environment: ${config.get<string>('app.env')}`);
  logger.log(`🛡️  Helmet: enabled | CORS: ${isProduction ? corsOrigins.join(', ') : '*'}`);
  logger.log(`🏥 Health: http://localhost:${port}/health`);
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.fatal('Failed to start application', err);
  process.exit(1);
});
