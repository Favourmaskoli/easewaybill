// import { Controller, Get, UseGuards } from '@nestjs/common';
// import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
// import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
// import { RolesGuard } from '../../common/guards/roles.guard';
// import { Roles } from '../../common/decorators/roles.decorator';
// import { CurrentUser } from '../../common/decorators/current-user.decorator';
// import { UserRole } from '@prisma/client';
// import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

// @ApiTags('admin')
// @ApiBearerAuth('access-token')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Controller('admin')
// export class AdminController {
//   @Get('dashboard')
//   @Roles(UserRole.ADMIN)
//   @ApiOperation({ summary: '[ADMIN] Dashboard stats' })
//   getDashboard(@CurrentUser() user: AuthenticatedUser) {
//     return {
//       message: 'Welcome to the admin dashboard',
//       accessedBy: user.email,
//       role: user.role,
//     };
//   }

//   @Get('users')
//   @Roles(UserRole.ADMIN)
//   @ApiOperation({ summary: '[ADMIN] List all users — placeholder' })
//   listUsers() {
//     return { message: 'User list — wired up in Phase 3' };
//   }
// }

import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { OrdersService } from '../orders/orders.service';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';
import { CreateAdminDto, CreateRiderDto, PromoteUserDto } from './dto/admin-user.dto';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly ordersService: OrdersService,
  ) {}

  // ── GET /admin/dashboard ──────────────────────────────────────────
  @Get('dashboard')
  @ApiOperation({ summary: '[ADMIN] Dashboard stats' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // ── GET /admin/users ──────────────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: '[ADMIN] List all users' })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  getUsers(
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.adminService.getUsers(role, search, Number(limit) || 20, cursor);
  }

  // ── PATCH /admin/users/:id/suspend ────────────────────────────────
  @Patch('users/:id/suspend')
  @ApiOperation({ summary: '[ADMIN] Suspend a user' })
  @ApiParam({ name: 'id' })
  suspendUser(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.suspendUser(id, admin.id);
  }

  // ── PATCH /admin/users/:id/unsuspend ──────────────────────────────
  @Patch('users/:id/unsuspend')
  @ApiOperation({ summary: '[ADMIN] Unsuspend a user' })
  @ApiParam({ name: 'id' })
  unsuspendUser(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.unsuspendUser(id, admin.id);
  }

  // ── GET /admin/escrow ─────────────────────────────────────────────
  @Get('escrow')
  @ApiOperation({ summary: '[ADMIN] Escrow ledger' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  getEscrowLedger(
    @Query('type') type?: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.adminService.getEscrowLedger(type, Number(limit) || 20, cursor);
  }

  // ── GET /admin/disputes ───────────────────────────────────────────
  @Get('disputes')
  @ApiOperation({ summary: '[ADMIN] List disputes' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  getDisputes(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.adminService.getDisputes(status, Number(limit) || 20, cursor);
  }

  // ── POST /admin/orders/:id/assign-rider ──────────────────────────
  @Post('orders/:id/assign-rider')
  @ApiOperation({ summary: '[ADMIN] Assign rider to a shipped order' })
  @ApiParam({ name: 'id' })
  assignRider(
    @Param('id') id: string,
    @Body() body: { riderId: string },
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.ordersService.assignRider(id, body.riderId, admin);
  }

  // ── PATCH /admin/orders/:id/status ───────────────────────────────
  @Patch('orders/:id/status')
  @ApiOperation({ summary: '[ADMIN] Override order status' })
  @ApiParam({ name: 'id' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.ordersService.updateStatus(id, dto, admin);
  }

  // ── POST /admin/users/create-rider ────────────────────────────────
  @Post('users/create-rider')
  @ApiOperation({ summary: '[ADMIN] Create a new rider account' })
  createRider(@Body() dto: CreateRiderDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.createRider(dto, admin.id);
  }

  // ── POST /admin/users/create-admin ────────────────────────────────
  @Post('users/create-admin')
  @ApiOperation({ summary: '[ADMIN] Create a new admin account' })
  createAdmin(@Body() dto: CreateAdminDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.createAdmin(dto, admin.id);
  }

  // ── PATCH /admin/users/:id/role ───────────────────────────────────
  @Patch('users/:id/role')
  @ApiOperation({ summary: '[ADMIN] Promote or demote a user role' })
  @ApiParam({ name: 'id' })
  changeUserRole(
    @Param('id') id: string,
    @Body() dto: PromoteUserDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.adminService.changeUserRole(id, dto, admin.id);
  }
}
