import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { EMAIL_QUEUE, EmailJobs } from './email.constants';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(
    private readonly config: ConfigService,
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
  ) {
    this.from = `${config.get<string>('email.fromName') ?? 'EaseWaybill'} <${config.get<string>('email.from') ?? 'noreply@easewaybill.com'}>`;

    this.transporter = nodemailer.createTransport({
      host: config.get<string>('email.host') ?? 'sandbox.smtp.mailtrap.io',
      port: config.get<number>('email.port') ?? 2525,
      auth: {
        user: config.get<string>('email.user'),
        pass: config.get<string>('email.pass'),
      },
    });
  }

  // ── Queue email for async delivery ────────────────────────────────
  async queueEmail(options: SendEmailOptions): Promise<void> {
    await this.emailQueue.add(EmailJobs.SEND_EMAIL, options, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    });

    this.logger.log(`Email queued: "${options.subject}" → ${options.to}`);
  }

  // ── Send immediately (called by processor) ────────────────────────
  async sendNow(options: SendEmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo ?? this.config.get<string>('email.from'),
      });

      this.logger.log(`Email sent: "${options.subject}" → ${options.to} | id: ${info.messageId}`);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Email failed: "${options.subject}" → ${options.to} | ${message}`);
      return false;
    }
  }
}
