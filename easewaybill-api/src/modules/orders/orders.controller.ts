// import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
// import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
// import { RolesGuard } from '../../common/guards/roles.guard';
// import { Roles } from '../../common/decorators/roles.decorator';
// import { CurrentUser } from '../../common/decorators/current-user.decorator';
// import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
// import { OrdersService } from './orders.service';
// import { CreateOrderDto } from './dto/create-order.dto';
// import { FilterOrdersDto } from './dto/filter-orders.dto';
// import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
// import { OrderResponseDto } from './dto/order-response.dto';
// import type { PaginatedResult } from '../../common/dto/pagination.dto';

// @ApiTags('orders')
// @ApiBearerAuth('access-token')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Controller('orders')
// export class OrdersController {
//   constructor(private readonly ordersService: OrdersService) {}

//   // ── POST /orders ─────────────────────────────────────────────────
//   @Post()
//   @Roles('SELLER' as any)
//   @ApiOperation({ summary: '[SELLER] Create a new order with items and waybill' })
//   @ApiResponse({ status: 201, type: OrderResponseDto })
//   @ApiResponse({ status: 400, description: 'Validation error' })
//   @ApiResponse({ status: 403, description: 'Forbidden — SELLER role required' })
//   async create(
//     @Body() dto: CreateOrderDto,
//     @CurrentUser() user: AuthenticatedUser,
//   ): Promise<OrderResponseDto> {
//     return this.ordersService.create(dto, user);
//   }

//   // ── GET /orders ──────────────────────────────────────────────────
//   @Get()
//   @ApiOperation({
//     summary: 'List orders — paginated and filterable by status',
//     description:
//       'SELLER sees own orders. BUYER sees purchased orders. RIDER sees assigned orders. ADMIN sees all.',
//   })
//   async findAll(
//     @Query() query: FilterOrdersDto,
//     @CurrentUser() user: AuthenticatedUser,
//   ): Promise<PaginatedResult<OrderResponseDto>> {
//     return this.ordersService.findAll(user, query);
//   }

//   // ── GET /orders/:id ──────────────────────────────────────────────
//   @Get(':id')
//   @ApiOperation({ summary: 'Get full order details by ID' })
//   @ApiResponse({ status: 200, type: OrderResponseDto })
//   @ApiResponse({ status: 404, description: 'Order not found' })
//   async findOne(
//     @Param('id') id: string,
//     @CurrentUser() user: AuthenticatedUser,
//   ): Promise<OrderResponseDto> {
//     return this.ordersService.findOne(id, user);
//   }

//   // ── PATCH /orders/:id/status ─────────────────────────────────────
//   @Patch(':id/status')
//   @ApiOperation({
//     summary: 'Update order status',
//     description: `State machine transitions:
// SELLER:  DRAFT → PENDING_BUYER | PAID → SHIPPED
// BUYER:   PENDING_BUYER → AWAITING_PAYMENT | DELIVERED → COMPLETED | DELIVERED → DISPUTED
// RIDER:   SHIPPED → IN_TRANSIT | IN_TRANSIT → DELIVERED
// ADMIN:   AWAITING_PAYMENT → PAID | DISPUTED → COMPLETED | DISPUTED → REFUNDED | any → CANCELLED`,
//   })
//   @ApiResponse({ status: 200, type: OrderResponseDto })
//   @ApiResponse({ status: 400, description: 'Invalid status transition' })
//   @ApiResponse({ status: 403, description: 'Role not allowed for this transition' })
//   @ApiResponse({ status: 404, description: 'Order not found' })
//   async updateStatus(
//     @Param('id') id: string,
//     @Body() dto: UpdateOrderStatusDto,
//     @CurrentUser() user: AuthenticatedUser,
//   ): Promise<OrderResponseDto> {
//     return this.ordersService.updateStatus(id, dto, user);
//   }
//   // ── POST /orders/:id/confirm ─────────────────────────────────────
//   @Post(':id/confirm')
//   @Roles('BUYER' as any)
//   @ApiOperation({
//     summary: '[BUYER] Confirm order details and link buyer to order',
//     description:
//       'Buyer confirms the order the seller created for them. Matches by buyerEmail. Moves status to AWAITING_PAYMENT.',
//   })
//   @ApiResponse({ status: 201, type: OrderResponseDto })
//   @ApiResponse({ status: 400, description: 'Order not in PENDING_BUYER status' })
//   @ApiResponse({ status: 404, description: 'Order not found or email mismatch' })
//   async confirmByBuyer(
//     @Param('id') id: string,
//     @CurrentUser() user: AuthenticatedUser,
//   ): Promise<OrderResponseDto> {
//     return this.ordersService.confirmByBuyer(id, user);
//   }
//   @Post(':id/assign-rider')
//   @Roles('ADMIN' as any)
//   @ApiOperation({ summary: '[ADMIN] Assign a rider to a shipped order' })
//   @ApiResponse({ status: 201, type: OrderResponseDto })
//   async assignRider(
//     @Param('id') id: string,
//     @Body() body: { riderId: string },
//     @CurrentUser() user: AuthenticatedUser,
//   ): Promise<OrderResponseDto> {
//     return this.ordersService.assignRider(id, body.riderId, user);
//   }
// }

import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import type { PaginatedResult } from '../../common/dto/pagination.dto';

@ApiTags('orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ── POST /orders ─────────────────────────────────────────────────
  @Post()
  @Roles('SELLER' as any)
  @ApiOperation({
    summary: '[SELLER] Create a new order',
    description:
      'Creates an order with items and auto-generates a waybill atomically. ' +
      'Calculates platform fee (5%) and rider payout from delivery fee.',
  })
  @ApiResponse({ status: 201, type: OrderResponseDto, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error — check required fields' })
  @ApiResponse({ status: 401, description: 'Unauthorised — missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden — SELLER role required' })
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderResponseDto> {
    return this.ordersService.create(dto, user);
  }

  // ── GET /orders ──────────────────────────────────────────────────
  @Get()
  @ApiOperation({
    summary: 'List orders — paginated and filterable',
    description:
      'Role-aware: SELLER sees own orders, BUYER sees purchased orders, ' +
      'RIDER sees assigned orders, ADMIN sees all. ' +
      'Supports cursor pagination, status filter, date range, and search.',
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by OrderStatus' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by tracking code or buyer email',
  })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Created from date (ISO 8601)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Created to date (ISO 8601)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Page size (default 20, max 100)' })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor for next page (last ID from previous page)',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of orders' })
  @ApiResponse({ status: 401, description: 'Unauthorised' })
  async findAll(
    @Query() query: FilterOrdersDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    return this.ordersService.findAll(user, query);
  }

  // ── GET /orders/:id ──────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({
    summary: 'Get single order with full details',
    description:
      'Returns order with seller, buyer, rider, items, and waybills. ' +
      'Only parties to the order can access it (seller, buyer, rider). Admin can access any.',
  })
  @ApiParam({ name: 'id', description: 'Order CUID' })
  @ApiResponse({ status: 200, type: OrderResponseDto, description: 'Full order details' })
  @ApiResponse({ status: 401, description: 'Unauthorised' })
  @ApiResponse({ status: 404, description: 'Order not found or not accessible to this user' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderResponseDto> {
    return this.ordersService.findOne(id, user);
  }

  // ── POST /orders/:id/confirm ─────────────────────────────────────
  @Post(':id/confirm')
  @Roles('BUYER' as any)
  @ApiOperation({
    summary: '[BUYER] Confirm order details and link buyer to order',
    description:
      'Buyer confirms the order a seller created for them. ' +
      'Matches by buyerEmail on the order. ' +
      'Links buyerId and moves status to AWAITING_PAYMENT.',
  })
  @ApiParam({ name: 'id', description: 'Order CUID' })
  @ApiResponse({ status: 201, type: OrderResponseDto, description: 'Order confirmed' })
  @ApiResponse({ status: 400, description: 'Order not in PENDING_BUYER status' })
  @ApiResponse({ status: 403, description: 'Forbidden — BUYER role required' })
  @ApiResponse({ status: 404, description: 'Order not found or email mismatch' })
  async confirmByBuyer(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderResponseDto> {
    return this.ordersService.confirmByBuyer(id, user);
  }

  // ── POST /orders/:id/assign-rider ────────────────────────────────
  @Post(':id/assign-rider')
  @Roles('ADMIN' as any)
  @ApiOperation({
    summary: '[ADMIN] Assign a rider to a shipped order',
    description: 'Assigns a rider to the order. Order must be in SHIPPED status.',
  })
  @ApiParam({ name: 'id', description: 'Order CUID' })
  @ApiBody({ schema: { properties: { riderId: { type: 'string' } }, required: ['riderId'] } })
  @ApiResponse({ status: 201, type: OrderResponseDto, description: 'Rider assigned' })
  @ApiResponse({ status: 400, description: 'Order not in SHIPPED status' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required' })
  @ApiResponse({ status: 404, description: 'Order or rider not found' })
  async assignRider(
    @Param('id') id: string,
    @Body() body: { riderId: string },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderResponseDto> {
    return this.ordersService.assignRider(id, body.riderId, user);
  }

  // ── PATCH /orders/:id/status ─────────────────────────────────────
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update order status via state machine',
    description: `Valid transitions per role:
• SELLER:  DRAFT → PENDING_BUYER | PAID → SHIPPED
• BUYER:   PENDING_BUYER → AWAITING_PAYMENT | DELIVERED → COMPLETED | DELIVERED → DISPUTED
• RIDER:   SHIPPED → IN_TRANSIT | IN_TRANSIT → DELIVERED
• ADMIN:   AWAITING_PAYMENT → PAID | DISPUTED → COMPLETED | DISPUTED → REFUNDED | any → CANCELLED`,
  })
  @ApiParam({ name: 'id', description: 'Order CUID' })
  @ApiResponse({ status: 200, type: OrderResponseDto, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorised' })
  @ApiResponse({ status: 403, description: 'Role not allowed for this transition' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateStatus(id, dto, user);
  }
}
