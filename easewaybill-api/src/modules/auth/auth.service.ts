import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
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
import { EmailService } from '../notifications/email/email.service';
import { CURRENT_TERMS_VERSION, EMAIL_VERIFICATION_TOKEN_TYPE } from './auth.constants';
import * as crypto from 'crypto';

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
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  avatarUrl: string | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: Date | null;
  vehicleType: string | null;
  vehiclePlate: string | null;
  isAvailable: boolean;
  termsAcceptedAt: Date | null;
  termsVersion: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Payload for the email-verification link. Deliberately NOT reusing
// JwtPayload/jwt.secret — signed with a separate secret so a verification
// token can never be replayed as an access token even if something
// upstream forgets to check the `type` field.
interface EmailVerificationPayload {
  sub: string;
  email: string;
  type: typeof EMAIL_VERIFICATION_TOKEN_TYPE;
}

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
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
        role: UserRole.USER,
        termsAcceptedAt: new Date(),
        termsVersion: CURRENT_TERMS_VERSION,
      },
    });

    this.logger.log(`New user registered: ${user.email} [${user.id}]`);

    // Fire-and-forget-ish: queued via BullMQ inside EmailService, so a
    // transient Resend/queue issue here should not block registration
    // itself. Still awaited so a synchronous config error (e.g. missing
    // API key) surfaces in logs immediately rather than silently.
    await this.sendVerificationEmail(user as PrismaUser);

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

    if (user.accountStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Account is deactivated');
    }

    this.logger.log(`User logged in: ${user.email} [${user.id}]`);
    return this.issueTokens(user as PrismaUser);
  }

  // ── Verify email ──────────────────────────────────────────────────
  async verifyEmail(rawToken: string): Promise<{ message: string }> {
    let payload: EmailVerificationPayload;

    try {
      payload = this.jwt.verify<EmailVerificationPayload>(rawToken, {
        secret: this.config.get<string>('jwt.emailVerificationSecret'),
      });
    } catch {
      throw new BadRequestException('Verification link is invalid or has expired');
    }

    if (payload.type !== EMAIL_VERIFICATION_TOKEN_TYPE) {
      throw new BadRequestException('Verification link is invalid or has expired');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw new BadRequestException('Verification link is invalid or has expired');
    }

    if (user.isEmailVerified) {
      // Idempotent — clicking an already-used link shouldn't error out.
      return { message: 'Email already verified' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    this.logger.log(`Email verified: ${user.email} [${user.id}]`);
    return { message: 'Email verified successfully' };
  }

  // ── Resend verification ───────────────────────────────────────────
  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Same response whether or not the account exists / is already
    // verified — avoids leaking account existence via response
    // differences (mirrors the constant-time approach used in login()).
    const genericResponse = {
      message:
        'If an account with that email exists and is unverified, a verification link has been sent.',
    };

    if (!user || user.isEmailVerified) {
      return genericResponse;
    }

    await this.sendVerificationEmail(user as PrismaUser);
    return genericResponse;
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

    if (!user || !user.refreshToken || user.accountStatus !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Refresh token revoked, user not found, or account is deactivated',
      );
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

  // ── Email verification helper ─────────────────────────────────────
  private async sendVerificationEmail(user: PrismaUser): Promise<void> {
    const payload: EmailVerificationPayload = {
      sub: user.id,
      email: user.email,
      type: EMAIL_VERIFICATION_TOKEN_TYPE,
    };

    const token = this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.emailVerificationSecret'),
      expiresIn: (this.config.get<string>('jwt.emailVerificationExpiresIn') ??
        '24h') as StringValue,
    });

    // ASSUMPTION — adjust config key / fallback to your real frontend
    // domain. This assumes a frontend route like /verify-email?token=...
    // that itself calls POST /auth/verify-email with the token.
    const frontendUrl = this.config.get<string>('frontend.url') ?? 'http://localhost:3000';
    console.log('FRONTEND_URL:', frontendUrl);
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    // Test-mode bypass: skip the real Resend call entirely and just log
    // the link, so you can copy/paste it straight from the terminal
    // without needing a verified Resend domain yet. Triggered by either
    // NODE_ENV=test (so Jest/e2e runs never hit Resend) or an explicit
    // SKIP_EMAIL_SEND=true env var (so you can also skip it in normal
    // `npm run start:dev` while testing this flow manually).
    const shouldSkipSend =
      this.config.get<string>('NODE_ENV') === 'test' ||
      process.env.NODE_ENV === 'test' ||
      process.env.SKIP_EMAIL_SEND === 'true';

    if (shouldSkipSend) {
      this.logger.warn(
        `[TEST MODE] Skipped sending verification email to ${user.email}. Link: ${verificationLink}`,
      );
      return;
    }

    await this.emailService.queueEmail({
      to: user.email,
      subject: 'Verify your EaseWaybill email',
      html: this.buildVerificationEmailHtml(user.firstName, verificationLink),
    });
  }

  private buildVerificationEmailHtml(firstName: string, link: string): string {
    return `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Hi ${firstName},</p>
        <p>Thanks for signing up for EaseWaybill. Please confirm your email address to get full access to your account.</p>
        <p>
          <a href="${link}" style="display:inline-block;padding:12px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;">
            Verify my email
          </a>
        </p>
        <p>Or paste this link into your browser:</p>
        <p style="word-break:break-all;color:#555;">${link}</p>
        <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
      </div>
    `;
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

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return the same response to prevent account enumeration.
    if (!user) {
      return {
        message: 'If that email exists, a reset link has been sent.',
      };
    }

    // Generate a cryptographically secure random token.
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Store only the hash of the token in the database.
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Token expires after 30 minutes.
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
      },
    });

    const frontendUrl = this.config.get<string>('frontend.url') ?? 'http://localhost:3000';

    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    await this.emailService.sendPasswordResetEmail(user.email, resetLink);

    return {
      message: 'If that email exists, a reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException('Invalid password reset request');
    }

    // Hash the token received from the user.
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const bcryptRounds = this.config.get<number>('bcrypt.rounds') ?? 12;

    const hashedPassword = await bcrypt.hash(newPassword, bcryptRounds);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      // If your application stores refresh tokens/sessions,
      // invalidate them here.
    });

    return {
      message: 'Password has been reset successfully',
    };
  }
}
