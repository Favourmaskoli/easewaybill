import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EscrowService } from './escrow.service';
import { HoldFundsDto } from './dto/hold-funds.dto';
import { ReleaseFundsDto } from './dto/release-funds.dto';
import { RefundFundsDto } from './dto/refund-funds.dto';
import { EscrowResponseDto } from './dto/escrow-response.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { EscrowSummaryDto } from './dto/escrow-summary.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('escrow')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  // ── POST /escrow/hold ─────────────────────────────────────────────
  @Post('hold')
  @Roles('ADMIN' as any)
  @ApiOperation({
    summary: '[ADMIN] Lock funds in escrow when payment confirmed',
    description:
      'In production triggered by Paystack webhook. ' +
      'Atomically creates ESCROW_HOLD + moves order to PAID + writes audit log. ' +
      'Schedules auto-release Bull job for 48h.',
  })
  @ApiResponse({ status: 201, type: EscrowResponseDto })
  @ApiResponse({ status: 400, description: 'Not AWAITING_PAYMENT or amount mismatch' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 409, description: 'Duplicate hold or reference' })
  async hold(
    @Body() dto: HoldFundsDto,
    @CurrentUser() _user: AuthenticatedUser,
  ): Promise<EscrowResponseDto> {
    return this.escrowService.holdFunds(dto);
  }

  // ── POST /escrow/release ──────────────────────────────────────────
  @Post('release')
  @Roles('ADMIN' as any)
  @ApiOperation({
    summary: '[ADMIN] Release escrowed funds to seller',
    description:
      'Called when buyer confirms satisfaction (COMPLETED). ' +
      'Also auto-triggered after 48h by Bull job. ' +
      'Creates PLATFORM_FEE + FULL_RELEASE + moves order to COMPLETED.',
  })
  @ApiResponse({ status: 201, type: EscrowResponseDto })
  @ApiResponse({ status: 400, description: 'Order not DELIVERED or COMPLETED' })
  @ApiResponse({ status: 404, description: 'Order not found or no active hold' })
  @ApiResponse({ status: 409, description: 'Already released or wrong escrow state' })
  async release(
    @Body() dto: ReleaseFundsDto,
    @CurrentUser() _user: AuthenticatedUser,
  ): Promise<EscrowResponseDto> {
    return this.escrowService.releaseFunds(dto, 'buyer');
  }

  // ── POST /escrow/refund ───────────────────────────────────────────
  @Post('refund')
  @Roles('ADMIN' as any)
  @ApiOperation({
    summary: '[ADMIN] Refund buyer when dispute resolved in their favour',
    description:
      'Creates REFUND transaction + moves order/escrow to REFUNDED. ' +
      'Cancels any pending auto-release job.',
  })
  @ApiResponse({ status: 201, type: EscrowResponseDto })
  @ApiResponse({ status: 400, description: 'Order not in DISPUTED status' })
  @ApiResponse({ status: 404, description: 'Order not found or no active hold' })
  @ApiResponse({ status: 409, description: 'Already refunded or escrow already released' })
  async refund(
    @Body() dto: RefundFundsDto,
    @CurrentUser() _user: AuthenticatedUser,
  ): Promise<EscrowResponseDto> {
    return this.escrowService.refundFunds(dto);
  }

  // ── GET /escrow/summary ───────────────────────────────────────────
  @Get('summary')
  @Roles('ADMIN' as any)
  @ApiOperation({
    summary: '[ADMIN] Aggregated escrow dashboard',
    description:
      'Returns totals: held, released, refunded, platform fees. ' +
      'Order counts by escrow status. Used for admin financial overview.',
  })
  @ApiResponse({ status: 200, type: EscrowSummaryDto })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required' })
  async getSummary(): Promise<EscrowSummaryDto> {
    return this.escrowService.getSummary();
  }

  // ── GET /escrow/:orderId ──────────────────────────────────────────
  @Get(':orderId')
  @Roles('ADMIN' as any, 'SELLER' as any, 'BUYER' as any)
  @ApiOperation({
    summary: 'Get escrow status and full history for an order',
    description:
      'Returns current escrow status, all transactions, and full audit log for the order.',
  })
  @ApiParam({ name: 'orderId', description: 'Order CUID' })
  @ApiResponse({
    status: 200,
    description: '{ escrowStatus, orderStatus, trackingCode, transactions[], auditLog[] }',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getStatus(@Param('orderId') orderId: string): Promise<{
    escrowStatus: string;
    orderStatus: string;
    trackingCode: string;
    transactions: EscrowResponseDto[];
    auditLog: AuditLogResponseDto[];
  }> {
    return this.escrowService.getStatus(orderId);
  }

  // ── GET /escrow/orders/:orderId/active ────────────────────────────
  @Get('orders/:orderId/active')
  @Roles('ADMIN' as any, 'SELLER' as any, 'BUYER' as any)
  @ApiOperation({ summary: 'Get active escrow hold for an order' })
  @ApiParam({ name: 'orderId' })
  @ApiResponse({ status: 200, type: EscrowResponseDto })
  async getActiveHold(@Param('orderId') orderId: string): Promise<EscrowResponseDto | null> {
    return this.escrowService.getActiveHold(orderId);
  }

  // ── GET /escrow/orders/:orderId/audit ─────────────────────────────
  @Get('orders/:orderId/audit')
  @Roles('ADMIN' as any)
  @ApiOperation({
    summary: '[ADMIN] Full escrow audit log for an order',
    description: 'Every state change: who, when, from/to status, amount, reason.',
  })
  @ApiParam({ name: 'orderId' })
  @ApiResponse({ status: 200, type: [AuditLogResponseDto] })
  async getAuditLog(@Param('orderId') orderId: string): Promise<AuditLogResponseDto[]> {
    return this.escrowService.getAuditLog(orderId);
  }
}
