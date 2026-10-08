import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TransferService } from './transfer.service';
import { NotificationEvents } from '../notifications/notifications.events';
import type { EscrowEventPayload } from '../notifications/notifications.events';

@Injectable()
export class TransferEventsListener {
  private readonly logger = new Logger(TransferEventsListener.name);

  constructor(private readonly transferService: TransferService) {}

  @OnEvent(NotificationEvents.ESCROW_RELEASED)
  async onEscrowReleased(payload: EscrowEventPayload): Promise<void> {
    this.logger.log(
      `ESCROW_RELEASED received for order [${payload.orderId}] — initiating Paystack transfer`,
    );

    try {
      await this.transferService.initiateTransfer({
        orderId: payload.orderId,
        reason: `Payout for order ${payload.trackingCode}`,
      });

      this.logger.log(`Transfer initiated for order [${payload.orderId}]`);
    } catch (err) {
      // initiateTransfer() throws ConflictException if a PENDING/SUCCESS
      // TransferRecord already exists for this order — expected and safe
      // to swallow. This is what makes the listener idempotent: even if
      // ESCROW_RELEASED somehow fired twice, only one transfer is ever created.
      if (err instanceof ConflictException) {
        this.logger.warn(
          `Transfer already exists for order [${payload.orderId}] — skipping duplicate.`,
        );
        return;
      }

      // Any other failure (Paystack API error, seller missing bank details,
      // etc.) must NOT crash the process or affect the already-committed
      // escrow release — per requirement, payment failures never roll back
      // or block the release itself. Log loudly for admin follow-up instead.
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Transfer initiation failed for order [${payload.orderId}]: ${message} — ` +
          `escrow was still released successfully. Manual retry available via POST /payments/transfer.`,
      );
    }
  }
}
