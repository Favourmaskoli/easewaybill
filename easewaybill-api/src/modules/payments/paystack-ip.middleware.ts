import { Injectable, NestMiddleware, ForbiddenException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

// https://paystack.com/docs/payments/webhooks/#ip-whitelisting
const PAYSTACK_IPS = new Set(['52.31.139.75', '52.49.173.169', '52.214.14.220']);

@Injectable()
export class PaystackIpMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PaystackIpMiddleware.name);

  constructor(private readonly config: ConfigService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    if (this.config.get<string>('app.env') !== 'production') return next();

    const forwarded = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
    const ip = (forwarded || req.socket.remoteAddress || '').replace(/^::ffff:/, '');

    if (!PAYSTACK_IPS.has(ip)) {
      // The HMAC signature check is the real security control.
      // Set PAYSTACK_IP_STRICT=true to also reject unknown IPs.
      this.logger.warn(`Webhook from IP not on the Paystack list: ${ip}`);
      if (this.config.get<string>('PAYSTACK_IP_STRICT') === 'true') {
        throw new ForbiddenException('Webhook request from unknown IP');
      }
    }

    next();
  }
}
