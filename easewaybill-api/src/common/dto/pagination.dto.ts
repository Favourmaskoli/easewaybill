import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Cursor — last ID from previous page' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    hasNextPage: boolean;
    nextCursor: string | null;
  };
}

export function paginate<T extends { id: string }>(
  items: T[],
  total: number,
  limit: number,
): PaginatedResult<T> {
  const hasNextPage = items.length === limit;
  const nextCursor = hasNextPage ? (items[items.length - 1]?.id ?? null) : null;

  return {
    data: items,
    meta: {
      total,
      limit,
      hasNextPage,
      nextCursor,
    },
  };
}

export function buildCursorWhere(cursor?: string): { id?: { lt: string } } {
  return cursor ? { id: { lt: cursor } } : {};
}
