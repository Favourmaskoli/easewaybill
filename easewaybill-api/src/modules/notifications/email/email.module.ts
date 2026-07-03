import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { EMAIL_QUEUE } from './email.constants';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: EMAIL_QUEUE,
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host') ?? 'localhost',
          port: config.get<number>('redis.port') ?? 6379,
          password: config.get<string>('redis.password') || undefined,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { count: 100 },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
