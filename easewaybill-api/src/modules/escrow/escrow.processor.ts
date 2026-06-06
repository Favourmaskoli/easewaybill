import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EscrowService } from './escrow.service';
import { ESCROW_QUEUE, EscrowJobs } from './escrow.constants';

interface AutoReleasePayload {
  orderId: string;
}

@Processor(ESCROW_QUEUE)
export class EscrowProcessor extends WorkerHost {
  private readonly logger = new Logger(EscrowProcessor.name);

  constructor(private readonly escrowService: EscrowService) {
    super();
  }

  async process(job: Job<AutoReleasePayload>): Promise<void> {
    if (job.name === EscrowJobs.AUTO_RELEASE) {
      await this.handleAutoRelease(job);
    }
  }

  private async handleAutoRelease(job: Job<AutoReleasePayload>): Promise<void> {
    const { orderId } = job.data;

    this.logger.log(`Auto-release job triggered for order [${orderId}]`);

    try {
      await this.escrowService.releaseFunds(
        {
          orderId,
          note: 'Auto-released after 48h — buyer did not raise a dispute',
        },
        'auto-release',
      );

      this.logger.log(`Auto-release completed for order [${orderId}]`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // These are expected — buyer already acted or order in terminal state
      if (
        message.includes('already been released') ||
        message.includes('COMPLETED') ||
        message.includes('DISPUTED') ||
        message.includes('CANCELLED') ||
        message.includes('REFUNDED')
      ) {
        this.logger.log(`Auto-release skipped for order [${orderId}]: ${message}`);
        return;
      }

      this.logger.error(`Auto-release failed for order [${orderId}]: ${message}`);
      throw err;
    }
  }
}
