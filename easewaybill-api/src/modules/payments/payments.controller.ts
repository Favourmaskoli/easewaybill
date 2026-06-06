import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { TransferService } from './transfer.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { InitiateTransferDto } from './dto/initiate-transfer.dto';
import { InitiatePaymentResponseDto, PaymentRecordDto } from './dto/payment-response.dto';
import { TransferRecordDto } from './dto/transfer-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import type { PaginatedResult } from '../../common/dto/pagination.dto';

@ApiTags('payments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly transferService: TransferService,
  ) {}

  // ── POST /payments/initiate ───────────────────────────────────────
  @Post('initiate')
  @Roles('BUYER' as any)
  @ApiOperation({
    summary: '[BUYER] Initiate Paystack payment for an order',
    description:
      'Calls Paystack Initialize Transaction API and returns an authorization_url. ' +
      'Frontend should redirect the buyer to this URL. ' +
      'After payment, Paystack sends a webhook which triggers escrow hold.',
  })
  @ApiResponse({ status: 201, type: InitiatePaymentResponseDto })
  @ApiResponse({ status: 400, description: 'Order not AWAITING_PAYMENT or already paid' })
  @ApiResponse({ status: 403, description: 'BUYER role required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async initiate(
    @Body() dto: InitiatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InitiatePaymentResponseDto> {
    return this.paymentsService.initiatePayment(dto, user);
  }

  // ── GET /payments/history ─────────────────────────────────────────
  @Get('history')
  @ApiOperation({
    summary: 'Get paginated payment history for current user',
    description:
      'BUYER sees their own payments. SELLER sees payments for their orders. ADMIN sees all.',
  })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'cursor', required: false, description: 'Last ID from previous page' })
  @ApiResponse({ status: 200, description: 'Paginated payment records with channel labels' })
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ): Promise<PaginatedResult<PaymentRecordDto & { channelLabel: string }>> {
    return this.paymentsService.getHistory(user, limit ? Number(limit) : 20, cursor);
  }

  // ── GET /payments/verify/:reference ──────────────────────────────
  @Get('verify/:reference')
  @ApiOperation({
    summary: 'Verify payment by reference — polling fallback',
    description:
      'Directly calls Paystack to verify a payment. ' +
      'Use this as a fallback if the webhook has not arrived yet. ' +
      'Updates the PaymentRecord if status changed.',
  })
  @ApiParam({ name: 'reference', example: 'EW-PAY-ABC123DEF456GH78' })
  @ApiResponse({ status: 200, description: 'Verification result with channel label' })
  @ApiResponse({ status: 400, description: 'Paystack verification failed' })
  @ApiResponse({ status: 404, description: 'Reference not found' })
  async verify(@Param('reference') reference: string): Promise<{
    reference: string;
    status: string;
    channelLabel: string;
    amount: number;
    paidAt: string | null;
    orderId: string;
    message: string;
  }> {
    return this.paymentsService.verifyByReference(reference);
  }

  // ── GET /payments/order/:orderId ──────────────────────────────────
  @Get('order/:orderId')
  @ApiOperation({
    summary: 'Get payment status for an order',
    description:
      'Returns all payment attempts for an order with their status, ' +
      'channel labels, and whether the order is fully paid.',
  })
  @ApiParam({ name: 'orderId', description: 'Order CUID' })
  @ApiResponse({ status: 200, description: 'Payment status and history for order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getPaymentStatus(@Param('orderId') orderId: string): Promise<{
    orderId: string;
    trackingCode: string;
    orderStatus: string;
    escrowStatus: string;
    payments: (PaymentRecordDto & { channelLabel: string })[];
    latestStatus: string;
    isPaid: boolean;
  }> {
    return this.paymentsService.getPaymentStatus(orderId);
  }

  // ── GET /payments/orders/:orderId ─────────────────────────────────
  @Get('orders/:orderId')
  @ApiOperation({ summary: 'Get all payment records for an order' })
  @ApiParam({ name: 'orderId' })
  @ApiResponse({ status: 200, type: [PaymentRecordDto] })
  async getByOrder(@Param('orderId') orderId: string): Promise<PaymentRecordDto[]> {
    return this.paymentsService.getByOrder(orderId);
  }

  // ── GET /payments/:reference ──────────────────────────────────────
  @Get(':reference')
  @ApiOperation({ summary: 'Get a payment record by Paystack reference' })
  @ApiParam({ name: 'reference', example: 'EW-PAY-ABC123DEF456GH78' })
  @ApiResponse({ status: 200, type: PaymentRecordDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getByReference(@Param('reference') reference: string): Promise<PaymentRecordDto> {
    return this.paymentsService.getByReference(reference);
  }

  // ── POST /payments/transfer ───────────────────────────────────────
  @Post('transfer')
  @Roles('ADMIN' as any)
  @ApiOperation({
    summary: '[ADMIN] Initiate Paystack transfer to seller bank account',
    description:
      'Transfers seller payout after escrow is RELEASED. ' +
      'Creates/caches Paystack transfer recipient from seller bank details.',
  })
  @ApiResponse({ status: 201, type: TransferRecordDto })
  @ApiResponse({ status: 400, description: 'Order not COMPLETED or missing bank details' })
  @ApiResponse({ status: 409, description: 'Transfer already initiated' })
  async initiateTransfer(@Body() dto: InitiateTransferDto): Promise<TransferRecordDto> {
    return this.transferService.initiateTransfer(dto);
  }

  // ── GET /payments/orders/:orderId/transfers ───────────────────────
  @Get('orders/:orderId/transfers')
  @Roles('ADMIN' as any, 'SELLER' as any)
  @ApiOperation({ summary: 'Get transfer records for an order' })
  @ApiParam({ name: 'orderId' })
  @ApiResponse({ status: 200, type: [TransferRecordDto] })
  async getTransfers(@Param('orderId') orderId: string): Promise<TransferRecordDto[]> {
    return this.transferService.getByOrder(orderId);
  }
}
