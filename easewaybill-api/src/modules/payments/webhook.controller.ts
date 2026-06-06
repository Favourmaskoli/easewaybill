import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhookService } from './webhook.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('webhooks')
@Controller('payments')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  // ── POST /payments/webhook ────────────────────────────────────────
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint() // hide from Swagger — not a public API
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
  ): Promise<{ received: boolean }> {
    // Raw body is required for HMAC signature verification
    // Set up in main.ts via rawBody: true
    const rawBody = req.rawBody?.toString('utf-8') ?? '';

    return this.webhookService.handleWebhook(rawBody, signature);
  }
}
