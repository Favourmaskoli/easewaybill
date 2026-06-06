import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

function mockContext(userRole: UserRole | null): ExecutionContext {
  const mockRequest = {
    user: userRole !== null ? { id: 'user-1', email: 'test@test.com', role: userRole } : undefined,
  };
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
    }),
  } as unknown as ExecutionContext;
}

function buildGuard(handlerRoles: UserRole[]) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(handlerRoles),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  describe('when no roles are required on the route', () => {
    it('should allow any authenticated user through', () => {
      const guard = buildGuard([]);
      expect(guard.canActivate(mockContext(UserRole.SENDER))).toBe(true);
    });

    it('should allow ADMIN through', () => {
      const guard = buildGuard([]);
      expect(guard.canActivate(mockContext(UserRole.ADMIN))).toBe(true);
    });
  });

  describe('when ADMIN role is required', () => {
    it('should allow ADMIN users', () => {
      const guard = buildGuard([UserRole.ADMIN]);
      expect(guard.canActivate(mockContext(UserRole.ADMIN))).toBe(true);
    });

    it('should throw ForbiddenException for SENDER', () => {
      const guard = buildGuard([UserRole.ADMIN]);
      expect(() => guard.canActivate(mockContext(UserRole.SENDER))).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for RIDER', () => {
      const guard = buildGuard([UserRole.ADMIN]);
      expect(() => guard.canActivate(mockContext(UserRole.RIDER))).toThrow(ForbiddenException);
    });
  });

  describe('when SENDER role is required', () => {
    it('should allow SENDER users', () => {
      const guard = buildGuard([UserRole.SENDER]);
      expect(guard.canActivate(mockContext(UserRole.SENDER))).toBe(true);
    });

    it('should throw ForbiddenException for RIDER', () => {
      const guard = buildGuard([UserRole.SENDER]);
      expect(() => guard.canActivate(mockContext(UserRole.RIDER))).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for ADMIN', () => {
      const guard = buildGuard([UserRole.SENDER]);
      expect(() => guard.canActivate(mockContext(UserRole.ADMIN))).toThrow(ForbiddenException);
    });
  });

  describe('when multiple roles are required (SENDER or ADMIN)', () => {
    it('should allow SENDER', () => {
      const guard = buildGuard([UserRole.SENDER, UserRole.ADMIN]);
      expect(guard.canActivate(mockContext(UserRole.SENDER))).toBe(true);
    });

    it('should allow ADMIN', () => {
      const guard = buildGuard([UserRole.SENDER, UserRole.ADMIN]);
      expect(guard.canActivate(mockContext(UserRole.ADMIN))).toBe(true);
    });

    it('should throw ForbiddenException for RIDER', () => {
      const guard = buildGuard([UserRole.SENDER, UserRole.ADMIN]);
      expect(() => guard.canActivate(mockContext(UserRole.RIDER))).toThrow(ForbiddenException);
    });
  });

  describe('when no user is attached to request', () => {
    it('should throw ForbiddenException', () => {
      const guard = buildGuard([UserRole.ADMIN]);
      expect(() => guard.canActivate(mockContext(null))).toThrow(ForbiddenException);
    });
  });

  describe('ForbiddenException messages', () => {
    it('should include the required role in the error message', () => {
      const guard = buildGuard([UserRole.ADMIN]);
      try {
        guard.canActivate(mockContext(UserRole.SENDER));
      } catch (err) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as ForbiddenException).message).toContain('ADMIN');
      }
    });

    it('should say no user found when user is missing', () => {
      const guard = buildGuard([UserRole.ADMIN]);
      try {
        guard.canActivate(mockContext(null));
      } catch (err) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as ForbiddenException).message).toContain('No authenticated user');
      }
    });
  });
});
