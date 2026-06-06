import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { JwtPayload, JwtRefreshPayload } from './interfaces/jwt-payload.interface';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

// Local type matching the generated Prisma User shape
interface PrismaUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  avatarUrl: string | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: Date | null;
  vehicleType: string | null;
  vehiclePlate: string | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Register ────────────────────────────────────────────────────
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role ?? UserRole.SELLER,
      },
    });

    this.logger.log(`New user registered: ${user.email} [${user.id}]`);
    return this.issueTokens(user as PrismaUser);
  }

  // ── Login ───────────────────────────────────────────────────────
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Constant-time comparison — never reveal whether email exists
    const dummyHash = '$2b$10$dummyhashfordummypassword1234567890123456789';
    const isValid =
      user !== null && (await bcrypt.compare(dto.password, user.passwordHash ?? dummyHash));

    if (!user || !isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    this.logger.log(`User logged in: ${user.email} [${user.id}]`);
    return this.issueTokens(user as PrismaUser);
  }

  // ── Refresh ─────────────────────────────────────────────────────
  async refresh(rawRefreshToken: string): Promise<AuthResponseDto> {
    let payload: JwtRefreshPayload;

    try {
      payload = this.jwt.verify<JwtRefreshPayload>(rawRefreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshToken || !user.isActive) {
      throw new UnauthorizedException('Refresh token revoked or user not found');
    }

    const isMatch = await bcrypt.compare(rawRefreshToken, user.refreshToken);
    if (!isMatch) {
      // Token reuse detected — revoke all tokens immediately
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null, refreshTokenExpiresAt: null },
      });
      throw new UnauthorizedException('Refresh token reuse detected. Please log in again.');
    }

    this.logger.log(`Token refreshed for: ${user.email} [${user.id}]`);
    return this.issueTokens(user as PrismaUser);
  }

  // ── Logout ──────────────────────────────────────────────────────
  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null, refreshTokenExpiresAt: null },
    });
    this.logger.log(`User logged out: [${userId}]`);
  }

  // ── Token issuance ───────────────────────────────────────────────
  private async issueTokens(user: PrismaUser): Promise<AuthResponseDto> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      email: user.email,
      tokenFamily: randomUUID(),
    };

    const accessToken = this.jwt.sign(accessPayload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.accessExpiresIn') as StringValue,
    });

    const refreshToken = this.jwt.sign(refreshPayload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>('jwt.refreshExpiresIn') as StringValue,
    });

    const hashedRefresh = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefresh,
        refreshTokenExpiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toUserResponse(user),
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────
  private toUserResponse(user: PrismaUser): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.phone = user.phone;
    dto.role = user.role as UserRole;
    dto.isEmailVerified = user.isEmailVerified;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
