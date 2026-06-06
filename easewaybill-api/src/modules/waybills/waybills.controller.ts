import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WaybillsService } from './waybills.service';
import { ScanWaybillDto } from './dto/scan-waybill.dto';
import { WaybillTrackingDto } from './dto/waybill-tracking.dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('waybills')
@Controller('waybills')
export class WaybillsController {
  constructor(private readonly waybillsService: WaybillsService) {}

  // ── GET /waybills/:waybillNumber — public ─────────────────────────
  @Public()
  @Get(':waybillNumber')
  @ApiOperation({
    summary: 'Public waybill tracking — no auth required',
    description:
      'Anyone with the waybill number can track the shipment. Returns status, timeline, and estimated delivery.',
  })
  @ApiResponse({ status: 200, type: WaybillTrackingDto })
  @ApiResponse({ status: 404, description: 'Waybill not found' })
  async track(@Param('waybillNumber') waybillNumber: string): Promise<WaybillTrackingDto> {
    return this.waybillsService.track(waybillNumber);
  }

  // ── POST /waybills/:waybillNumber/scan — rider ────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':waybillNumber/scan')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '[RIDER] Scan waybill to record location checkpoint',
    description:
      'Rider scans waybill at a checkpoint. Creates a WaybillEvent with timestamp, location, and current order status.',
  })
  @ApiResponse({ status: 201, type: WaybillTrackingDto })
  @ApiResponse({ status: 400, description: 'Order not in scannable status' })
  @ApiResponse({ status: 403, description: 'Not the assigned rider' })
  @ApiResponse({ status: 404, description: 'Waybill not found' })
  async scan(
    @Param('waybillNumber') waybillNumber: string,
    @Body() dto: ScanWaybillDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WaybillTrackingDto> {
    return this.waybillsService.scan(waybillNumber, dto, user);
  }
}
