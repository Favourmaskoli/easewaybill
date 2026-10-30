import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { timingSafeEqual } from 'crypto';

import { Public } from '../auth/decorators/public.decorator';
import { ReconciliationService } from './reconciliation.service';
import type { ReconcileStats } from './reconciliation.service';

// Called by Vercel Cron (or any external scheduler). Public for the JWT guard,
// but protected by the CRON_SECRET bearer token instead.
@ApiExcludeController()
@Public()
@Controller('internal')
export class ReconcileController {
  constructor(
    private readonly reconciliation: ReconciliationService,
    private readonly config: ConfigService,
  ) {}

  // GET /internal/reconcile-payments
  @Get('reconcile-payments')
  async run(@Headers('authorization') auth?: string): Promise<ReconcileStats> {
    const secret = this.config.get<string>('CRON_SECRET');
    const expected = Buffer.from(`Bearer ${secret ?? ''}`);
    const given = Buffer.from(auth ?? '');

    if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw new UnauthorizedException();
    }

    return this.reconciliation.run();
  }
}
