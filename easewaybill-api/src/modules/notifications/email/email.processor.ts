import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from './email.service';
import { EMAIL_QUEUE, EmailJobs } from './email.constants';
import type { SendEmailOptions } from './email.service';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<SendEmailOptions>): Promise<void> {
    if (job.name === EmailJobs.SEND_EMAIL) {
      this.logger.log(`Processing email job ${job.id}: "${job.data.subject}" → ${job.data.to}`);

      const success = await this.emailService.sendNow(job.data);

      if (!success) {
        throw new Error(`Email delivery failed for job ${job.id} — will retry`);
      }
    }
  }
}
