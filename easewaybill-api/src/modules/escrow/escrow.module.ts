import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { EscrowProcessor } from './escrow.processor';
import { ESCROW_QUEUE } from './escrow.constants';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: ESCROW_QUEUE,
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
          removeOnFail: { count: 500 },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [EscrowController],
  providers: [EscrowService, EscrowProcessor],
  exports: [EscrowService],
})
export class EscrowModule {}
