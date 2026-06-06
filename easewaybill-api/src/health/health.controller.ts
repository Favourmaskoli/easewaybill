import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../modules/auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      environment: this.config.get<string>('app.env'),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
