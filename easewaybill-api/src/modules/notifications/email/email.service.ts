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
    @InjectQueue(EMAIL_QUEUE)
    private readonly emailQueue: Queue,
  ) {
    const host = this.config.get<string>('email.host');
    const port = this.config.get<number>('email.port');
    const user = this.config.get<string>('email.user');
    const pass = this.config.get<string>('email.pass');

    if (!host || !port || !user || !pass) {
      this.logger.warn(
        'Email SMTP configuration is incomplete. Check your email environment variables.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: this.config.get<boolean>('email.secure') ?? false,
      auth: {
        user,
        pass,
      },
    });

    const fromName = this.config.get<string>('email.fromName') ?? 'EaseWaybill';

    const fromEmail = this.config.get<string>('email.from') ?? user;

    this.from = `${fromName} <${fromEmail}>`;
  }

  // ── Queue email for async delivery ────────────────────────────────
  async queueEmail(options: SendEmailOptions): Promise<void> {
    await this.emailQueue.add(EmailJobs.SEND_EMAIL, options, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        count: 100,
      },
      removeOnFail: {
        count: 500,
      },
    });

    this.logger.log(`Email queued: "${options.subject}" → ${options.to}`);
  }

  // ── Send immediately ──────────────────────────────────────────────
  async sendNow(options: SendEmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo ?? this.config.get<string>('email.from'),
      });

      this.logger.log(
        `Email sent: "${options.subject}" → ${options.to} | messageId: ${info.messageId}`,
      );

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(`Email failed: "${options.subject}" → ${options.to} | ${message}`);

      return false;
    }
  }
  // ───────────────────────────────────────────────────────────────password reset email───────────────────────────────────────────────
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Reset your EaseWaybill password</h2>
      <p>We received a request to reset your password. Click the button below to choose a new one:</p>
      <p style="margin: 24px 0;">
        <a href="${resetLink}" style="background:#0d6efd;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
      </p>
      <p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
      <p style="color:#888;font-size:12px;">If the button doesn't work, copy and paste this link: ${resetLink}</p>
    </div>
  `;

    await this.queueEmail({
      to,
      subject: 'Reset your EaseWaybill password',
      html,
    });
  }
}
