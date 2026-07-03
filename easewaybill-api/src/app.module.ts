import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { appConfig } from './config/app.config';
import { configValidationSchema } from './config/config.schema';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { OrdersModule } from './modules/orders/orders.module';
import { UsersModule } from './modules/users/users.module';
import { WaybillsModule } from './modules/waybills/waybills.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { EscrowModule } from './modules/escrow/escrow.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PaystackIpMiddleware } from './modules/payments/paystack-ip.middleware';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
      expandVariables: true,
      cache: true,
    }),

    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
            limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
          },
        ],
      }),
    }),

    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    NotificationsModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    AdminModule,
    OrdersModule,
    UsersModule,
    WaybillsModule,
    DisputesModule,
    EscrowModule,
    PaymentsModule,
  ],

  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },

    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },

    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },

    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        disableErrorMessages: process.env.NODE_ENV === 'production',
      }),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(PaystackIpMiddleware)
      .forRoutes({ path: 'payments/webhook', method: RequestMethod.POST });
  }
}
