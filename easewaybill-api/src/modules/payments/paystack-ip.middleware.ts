import { Injectable, NestMiddleware, ForbiddenException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

// Official Paystack IP whitelist
// https://paystack.com/docs/payments/webhooks/#ip-whitelisting
const PAYSTACK_IPS = ['52.31.139.75', '52.49.173.169', '52.214.14.220'];

@Injectable()
export class PaystackIpMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PaystackIpMiddleware.name);

  constructor(private readonly config: ConfigService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    // Skip IP check in development
    if (this.config.get<string>('app.env') !== 'production') {
      return next();
    }

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      '';

    if (!PAYSTACK_IPS.includes(ip)) {
      this.logger.warn(`Webhook blocked — unknown IP: ${ip}`);
      throw new ForbiddenException('Webhook request from unknown IP');
    }

    next();
  }
}
