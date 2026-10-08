import { ApiProperty } from '@nestjs/swagger';
import { DisputeResponseDto } from './dispute-response.dto';

export class PaginatedDisputesDto {
  @ApiProperty({ type: [DisputeResponseDto] })
  declare data: DisputeResponseDto[];

  @ApiProperty()
  declare total: number;

  @ApiProperty()
  declare page: number;

  @ApiProperty()
  declare pageSize: number;

  @ApiProperty()
  declare totalPages: number;
}
