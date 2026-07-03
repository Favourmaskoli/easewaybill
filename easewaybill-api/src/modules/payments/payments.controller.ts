import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import {
  InitiatePaymentResponseDto,
  PaymentRecordDto,
} from './dto/payment-response.dto';
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
  @ApiOperation({
    summary: 'Initiate Paystack payment for an order',
    description:
      'Any authenticated user can pay for an order where their account ' +
      'email matches buyerEmail on the order, or where they are the linked buyer. ' +
      'Returns authorizationUrl — redirect the buyer to this URL to complete payment on Paystack. ' +
      'After payment, Paystack sends a webhook to /payments/webhook which updates ' +
      'the order to PAID and triggers escrow hold. ' +
      'The frontend also calls /payments/verify/:reference on callback as a fallback.',
  })
  @ApiResponse({ status: 201, type: InitiatePaymentResponseDto })
  @ApiResponse({
    status: 400,
    description:
      'Order not in AWAITING_PAYMENT status, or a successful payment already exists',
  })
  @ApiResponse({ status: 401, description: 'Unauthorised — missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  // ✅ No @Roles guard — any authenticated user can pay for an order
  // addressed to their email, regardless of their account role field.
  // Authorization is enforced inside PaymentsService.initiatePayment()
  // by checking order.buyerId === user.id OR order.buyerEmail === user.email
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
      'Returns payment records for all orders the user is involved in — ' +
      'either as seller OR buyer. ' +
      'A user with role SELLER who paid as a buyer on another order will ' +
      'see both sets of records. ADMIN sees all records.',
  })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Last ID from previous page for cursor pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated payment records with channel labels',
  })
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ): Promise<PaginatedResult<PaymentRecordDto & { channelLabel: string }>> {
    return this.paymentsService.getHistory(
      user,
      limit ? Number(limit) : 20,
      cursor,
    );
  }

  // ── GET /payments/verify/:reference ──────────────────────────────
  // NOTE: This endpoint intentionally has no @Roles guard.
  // It is protected by JwtAuthGuard (token required) but open to
  // any authenticated user. The frontend calls this on the Paystack
  // callback URL to verify payment and update order status to PAID
  // without waiting for the webhook. Both webhook and verify are
  // idempotent — calling both is safe.
  @Get('verify/:reference')
  @ApiOperation({
    summary: 'Verify payment by Paystack reference — callback fallback',
    description:
      'Directly calls Paystack to verify a payment reference. ' +
      'Use this as a reliable fallback when the buyer returns from Paystack ' +
      'and the webhook has not yet arrived. ' +
      'If Paystack confirms success, this endpoint atomically updates both ' +
      'the PaymentRecord (status → SUCCESS) and the Order (status → PAID). ' +
      'Safe to call multiple times — idempotent.',
  })
  @ApiParam({ name: 'reference', example: 'EW-PAY-ABC123DEF456GH78' })
  @ApiResponse({
    status: 200,
    description: 'Verification result with payment status and channel label',
  })
  @ApiResponse({ status: 400, description: 'Paystack verification failed' })
  @ApiResponse({ status: 404, description: 'Reference not found in our records' })
  async verify(
    @Param('reference') reference: string,
  ): Promise<{
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
    summary: 'Get payment status for a specific order',
    description:
      'Returns all payment attempts for an order with their status, ' +
      'channel labels, and whether the order is fully paid. ' +
      'Useful for checking payment state without calling Paystack directly.',
  })
  @ApiParam({ name: 'orderId', description: 'Order CUID' })
  @ApiResponse({
    status: 200,
    description: 'Payment status summary and history for the order',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getPaymentStatus(
    @Param('orderId') orderId: string,
  ): Promise<{
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
  @ApiOperation({
    summary: 'Get all payment records for an order',
    description: 'Returns every PaymentRecord associated with an order, newest first.',
  })
  @ApiParam({ name: 'orderId' })
  @ApiResponse({ status: 200, type: [PaymentRecordDto] })
  async getByOrder(
    @Param('orderId') orderId: string,
  ): Promise<PaymentRecordDto[]> {
    return this.paymentsService.getByOrder(orderId);
  }

  // ── GET /payments/:reference ──────────────────────────────────────
  // NOTE: This route must come LAST among GET routes to avoid shadowing
  // /payments/history, /payments/verify/:reference, etc.
  @Get(':reference')
  @ApiOperation({
    summary: 'Get a payment record by Paystack reference',
    description:
      'Fetches a single PaymentRecord from our database by reference string. ' +
      'Does NOT call Paystack — use /payments/verify/:reference for live verification.',
  })
  @ApiParam({ name: 'reference', example: 'EW-PAY-ABC123DEF456GH78' })
  @ApiResponse({ status: 200, type: PaymentRecordDto })
  @ApiResponse({ status: 404, description: 'Payment record not found' })
  async getByReference(
    @Param('reference') reference: string,
  ): Promise<PaymentRecordDto> {
    return this.paymentsService.getByReference(reference);
  }

  // ── POST /payments/transfer ───────────────────────────────────────
  @Post('transfer')
  @Roles('ADMIN' as any)
  @ApiOperation({
    summary: '[ADMIN] Initiate Paystack transfer to seller bank account',
    description:
      'Transfers the seller payout after escrow is RELEASED. ' +
      'Creates or reuses a Paystack transfer recipient from the seller\'s ' +
      'bank account details stored in their profile. ' +
      'Only callable after the order reaches COMPLETED status and escrow is RELEASED. ' +
      'Idempotent — will not create duplicate transfers for the same order.',
  })
  @ApiResponse({ status: 201, type: TransferRecordDto })
  @ApiResponse({
    status: 400,
    description: 'Order not COMPLETED, escrow not RELEASED, or seller bank details missing',
  })
  @ApiResponse({ status: 409, description: 'Transfer already initiated for this order' })
  async initiateTransfer(
    @Body() dto: InitiateTransferDto,
  ): Promise<TransferRecordDto> {
    return this.transferService.initiateTransfer(dto);
  }

  // ── GET /payments/orders/:orderId/transfers ───────────────────────
  @Get('orders/:orderId/transfers')
  @Roles('ADMIN' as any, 'SELLER' as any)
  @ApiOperation({
    summary: '[ADMIN/SELLER] Get transfer records for an order',
    description:
      'Returns all Paystack transfer records for an order. ' +
      'SELLER can view their own payout status. ADMIN can view any order.',
  })
  @ApiParam({ name: 'orderId' })
  @ApiResponse({ status: 200, type: [TransferRecordDto] })
  async getTransfers(
    @Param('orderId') orderId: string,
  ): Promise<TransferRecordDto[]> {
    return this.transferService.getByOrder(orderId);
  }
}