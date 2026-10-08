import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Attach AFTER JwtAuthGuard on any route that should require a verified
 * email and accepted Terms & Conditions:
 *
 *   @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
 *
 * Deliberately re-fetches the user from the DB rather than trusting the
 * JWT payload — isEmailVerified/termsAcceptedAt can change after a token
 * was issued (e.g. user verifies mid-session), and the access token isn't
 * reissued when that happens, so the JWT claim would go stale.
 *
 * NOT applied globally — this file only defines the guard. Decide
 * per-route (or per-controller) where "full access" should actually be
 * blocked; auth routes themselves (register/login/verify/resend/refresh)
 * must never carry this guard, or nobody could ever complete onboarding.
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requestUser = request.user;

    if (!requestUser?.id) {
      // JwtAuthGuard should have already rejected this — treat missing
      // user as a misconfiguration (guard order) rather than silently
      // allowing through.
      throw new ForbiddenException('Authentication required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: requestUser.id },
      select: { isEmailVerified: true, termsAcceptedAt: true },
    });

    if (!user) {
      throw new ForbiddenException('Account not found');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Please verify your email address to continue');
    }

    if (!user.termsAcceptedAt) {
      throw new ForbiddenException('Please accept the Terms & Conditions to continue');
    }

    return true;
  }
}
