import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaystackService } from './paystack.service';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { TransferService } from './transfer.service';
import { EscrowModule } from '../escrow/escrow.module';

@Module({
  imports: [EscrowModule],
  controllers: [PaymentsController, WebhookController],
  providers: [PaymentsService, PaystackService, WebhookService, TransferService],
  exports: [PaymentsService, PaystackService, TransferService],
})
export class PaymentsModule {}
