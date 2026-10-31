import { Controller, Headers, HttpCode, HttpStatus, Logger, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { WebhookService } from './webhook.service';
import { Public } from '../auth/decorators/public.decorator';

@SkipThrottle()
@ApiTags('webhooks')
@Controller('payments')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  // ── POST /payments/webhook ────────────────────────────────────────
  // Not rate-limited: Paystack retries from a few fixed IPs. Security comes from
  // the HMAC signature check (and the IP middleware, which only logs by default).
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint() // hide from Swagger — not a public API
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
  ): Promise<{ received: boolean }> {
    // Raw body is required for HMAC signature verification (rawBody: true in main.ts)
    const rawBody = req.rawBody?.toString('utf-8') ?? '';
    this.logger.log('Webhook received');

    return this.webhookService.handleWebhook(rawBody, signature);
  }
}
