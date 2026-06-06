import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Dashboard stats' })
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Welcome to the admin dashboard',
      accessedBy: user.email,
      role: user.role,
    };
  }

  @Get('users')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] List all users — placeholder' })
  listUsers() {
    return { message: 'User list — wired up in Phase 3' };
  }
}
