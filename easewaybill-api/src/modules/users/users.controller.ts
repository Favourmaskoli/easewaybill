import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, UpdateRoleDto } from './dto/update-profile.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── GET /users/me ────────────────────────────────────────────────
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserProfileDto> {
    return this.usersService.getProfile(user.id);
  }

  // ── PATCH /users/me ──────────────────────────────────────────────
  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateProfile(user.id, dto);
  }

  // ── GET /users (ADMIN) ───────────────────────────────────────────
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] List all users' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  @ApiResponse({ status: 200, type: [UserProfileDto] })
  async findAll(@Query('role') role?: UserRole): Promise<UserProfileDto[]> {
    return this.usersService.findAll(role);
  }

  // ── GET /users/:id (ADMIN) ───────────────────────────────────────
  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Get user by ID' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<UserProfileDto> {
    return this.usersService.findById(id);
  }

  // ── PATCH /users/:id/role (ADMIN) ────────────────────────────────
  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Update a user role' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<UserProfileDto> {
    return this.usersService.updateRole(admin.id, id, dto);
  }

  // ── DELETE /users/:id (ADMIN — soft delete) ──────────────────────
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[ADMIN] Deactivate a user account' })
  @ApiResponse({ status: 204, description: 'User deactivated' })
  async deactivate(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<void> {
    return this.usersService.deactivate(admin.id, id);
  }
}
