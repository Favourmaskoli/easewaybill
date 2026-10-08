import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { TrackWaybillResponseDto } from './dto/track-waybill-response.dto';

// Note: no @UseGuards() here — this controller is intentionally public,
// unlike OrdersController which applies JwtAuthGuard + RolesGuard.
@ApiTags('tracking')
@Controller('track')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':waybillNumber')
  @ApiOperation({
    summary: 'Public shipment tracking by waybill number',
    description:
      'Read-only, unauthenticated endpoint. Returns order/shipment status and ' +
      'full event timeline for a given waybill number. No auth required.',
  })
  @ApiParam({ name: 'waybillNumber', description: 'Waybill number, e.g. WB-ABC12345' })
  @ApiResponse({ status: 200, type: TrackWaybillResponseDto, description: 'Shipment status' })
  @ApiResponse({ status: 404, description: 'No shipment found for this waybill number' })
  async track(@Param('waybillNumber') waybillNumber: string): Promise<TrackWaybillResponseDto> {
    return this.trackingService.trackByWaybillNumber(waybillNumber);
  }
}
