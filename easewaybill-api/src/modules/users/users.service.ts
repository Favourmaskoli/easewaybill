import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto, UpdateRoleDto } from './dto/update-profile.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { UserRole } from '@prisma/client';

// Fields never returned in any response
const EXCLUDED_FIELDS = {
  passwordHash: false,
  refreshToken: false,
  refreshTokenExpiresAt: false,
};

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isEmailVerified: true,
  isActive: true,
  avatarUrl: true,
  businessName: true,
  bankAccountName: true,
  bankAccountNumber: true,
  bankCode: true,
  vehicleType: true,
  vehiclePlate: true,
  isAvailable: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: false,
  refreshToken: false,
  refreshTokenExpiresAt: false,
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── GET /users/me ────────────────────────────────────────────────
  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user as unknown as UserProfileDto;
  }

  // ── PATCH /users/me ──────────────────────────────────────────────
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.vehicleType !== undefined && { vehicleType: dto.vehicleType }),
        ...(dto.vehiclePlate !== undefined && { vehiclePlate: dto.vehiclePlate }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
        ...(dto.businessName !== undefined && { businessName: dto.businessName }),
        ...(dto.bankAccountName !== undefined && { bankAccountName: dto.bankAccountName }),
        ...(dto.bankAccountNumber !== undefined && { bankAccountNumber: dto.bankAccountNumber }),
        ...(dto.bankCode !== undefined && { bankCode: dto.bankCode }),
      },
      select: USER_SELECT,
    });

    this.logger.log(`Profile updated: [${userId}]`);
    return updated as unknown as UserProfileDto;
  }

  // ── GET /users/:id (ADMIN only) ──────────────────────────────────
  async findById(id: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user as unknown as UserProfileDto;
  }

  // ── GET /users (ADMIN only) ──────────────────────────────────────
  async findAll(role?: UserRole): Promise<UserProfileDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        accountStatus: 'ACTIVE',
        ...(role && { role }),
      },
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    return users as unknown as UserProfileDto[];
  }

  // ── PATCH /users/:id/role (ADMIN only) ───────────────────────────
  async updateRole(
    adminId: string,
    targetUserId: string,
    dto: UpdateRoleDto,
  ): Promise<UserProfileDto> {
    // Prevent admin from changing their own role
    if (adminId === targetUserId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException(`User ${targetUserId} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: dto.role },
      select: USER_SELECT,
    });

    this.logger.log(
      `Role updated: [${targetUserId}] ${user.role} → ${dto.role} by admin [${adminId}]`,
    );

    return updated as unknown as UserProfileDto;
  }

  // ── DELETE /users/:id (ADMIN only — soft delete) ─────────────────
  async deactivate(adminId: string, targetUserId: string): Promise<void> {
    if (adminId === targetUserId) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException(`User ${targetUserId} not found`);
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { accountStatus: 'SUSPENDED' },
    });

    this.logger.log(`User deactivated: [${targetUserId}] by admin [${adminId}]`);
  }
}
