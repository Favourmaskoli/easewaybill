// import { IsDateString, IsOptional, IsString } from 'class-validator';
// import { ApiPropertyOptional } from '@nestjs/swagger';
// import { PaginationDto } from '../../../common/dto/pagination.dto';

// export class FilterOrdersDto extends PaginationDto {
//   @ApiPropertyOptional({
//     enum: [
//       'DRAFT',
//       'PENDING_BUYER',
//       'AWAITING_PAYMENT',
//       'PAID',
//       'SHIPPED',
//       'IN_TRANSIT',
//       'DELIVERED',
//       'COMPLETED',
//       'DISPUTED',
//       'CANCELLED',
//       'REFUNDED',
//     ],
//   })
//   @IsOptional()
//   @IsString()
//   status?: string;

//   @ApiPropertyOptional({ example: 'EW-ABC12345' })
//   @IsOptional()
//   @IsString()
//   trackingCode?: string;
// }

import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterOrdersDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: [
      'DRAFT',
      'PENDING_BUYER',
      'AWAITING_PAYMENT',
      'PAID',
      'SHIPPED',
      'IN_TRANSIT',
      'DELIVERED',
      'COMPLETED',
      'DISPUTED',
      'CANCELLED',
      'REFUNDED',
    ],
    example: 'PAID',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Search by tracking code or buyer email',
    example: 'EW-ABC12345',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter orders created from this date (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter orders created up to this date (ISO 8601)',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
