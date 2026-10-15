
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { appConfig } from './config/app.config';
import { configValidationSchema } from './config/config.schema';
import { PrismaModule } from './prisma/prisma.module';
import { EscrowModule } from './modules/escrow/escrow.module';
import { EscrowProcessor } from './modules/escrow/escrow.processor';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EmailModule } from './modules/notifications/email/email.module';
import { EmailProcessor } from './modules/notifications/email/email.processor';
import { PaymentsModule } from './modules/payments/payments.module';

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

    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),

    PrismaModule,
    EscrowModule,
    EmailModule,
    NotificationsModule,
    PaymentsModule,
  ],
  providers: [EmailProcessor, EscrowProcessor],
})
export class WorkerModule {}
