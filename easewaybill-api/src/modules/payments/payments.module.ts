import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaystackService } from './paystack.service';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { TransferService } from './transfer.service';
import { TransferEventsListener } from './transfer.listener';
import { EscrowModule } from '../escrow/escrow.module';
import { ReconcileController } from './reconcile.controller';
import { ReconciliationService } from './reconciliation.service';
import { PaymentSettlementService } from './payment-settlement.service';

@Module({
  imports: [EscrowModule],
  controllers: [PaymentsController, WebhookController, ReconcileController],
  providers: [
    PaymentsService,
    PaystackService,
    WebhookService,
    TransferService,
    TransferEventsListener,
    PaymentSettlementService,
    ReconciliationService,
  ],
  exports: [PaymentsService, PaystackService, TransferService],
})
export class PaymentsModule {}
