import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DisputesService } from './disputes.service';
import { RaiseDisputeDto } from './dto/raise-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { DisputeResponseDto } from './dto/dispute-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('disputes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  // ── POST /orders/:id/dispute ──────────────────────────────────────
  @Post('orders/:id/dispute')
  @Roles('BUYER' as any)
  @ApiOperation({
    summary: '[BUYER] Raise a dispute on a delivered order',
    description: 'Only the buyer can raise a dispute. Order must be in DELIVERED status.',
  })
  @ApiResponse({ status: 201, type: DisputeResponseDto })
  @ApiResponse({ status: 400, description: 'Order not delivered or dispute already exists' })
  @ApiResponse({ status: 403, description: 'Only buyer can raise disputes' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async raise(
    @Param('id') orderId: string,
    @Body() dto: RaiseDisputeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DisputeResponseDto> {
    return this.disputesService.raise(orderId, dto, user);
  }

  // ── PATCH /orders/:id/dispute ─────────────────────────────────────
  @Patch('orders/:id/dispute')
  @Roles('ADMIN' as any)
  @ApiOperation({
    summary: '[ADMIN] Resolve a dispute',
    description:
      'RESOLVED_FOR_BUYER → order becomes REFUNDED, escrow refunded. RESOLVED_FOR_SELLER → order becomes COMPLETED, escrow released.',
  })
  @ApiResponse({ status: 200, type: DisputeResponseDto })
  @ApiResponse({ status: 400, description: 'Order not in DISPUTED status or already resolved' })
  @ApiResponse({ status: 403, description: 'Only admin can resolve disputes' })
  @ApiResponse({ status: 404, description: 'Order or dispute not found' })
  async resolve(
    @Param('id') orderId: string,
    @Body() dto: ResolveDisputeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DisputeResponseDto> {
    return this.disputesService.resolve(orderId, dto, user);
  }

  // ── GET /orders/:id/dispute ───────────────────────────────────────
  @Get('orders/:id/dispute')
  @ApiOperation({ summary: 'Get dispute for an order' })
  @ApiResponse({ status: 200, type: DisputeResponseDto })
  @ApiResponse({ status: 404, description: 'No dispute found' })
  async findOne(
    @Param('id') orderId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DisputeResponseDto> {
    return this.disputesService.findOne(orderId, user);
  }

  // ── GET /disputes (ADMIN) ─────────────────────────────────────────
  @Get('disputes')
  @Roles('ADMIN' as any)
  @ApiOperation({ summary: '[ADMIN] List all disputes' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, type: [DisputeResponseDto] })
  async findAll(@Query('status') status?: string): Promise<DisputeResponseDto[]> {
    return this.disputesService.findAll(status);
  }
}
