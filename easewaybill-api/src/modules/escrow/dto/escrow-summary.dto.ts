import { ApiProperty } from '@nestjs/swagger';

export class EscrowSummaryDto {
  @ApiProperty({ description: 'Total number of orders with escrow activity' })
  declare totalOrders: number;

  @ApiProperty({ description: 'Total amount currently held in escrow (NGN)' })
  declare totalHeld: number;

  @ApiProperty({ description: 'Total amount released to sellers (NGN)' })
  declare totalReleased: number;

  @ApiProperty({ description: 'Total amount refunded to buyers (NGN)' })
  declare totalRefunded: number;

  @ApiProperty({ description: 'Total platform fees collected (NGN)' })
  declare totalPlatformFees: number;

  @ApiProperty({ description: 'Number of orders currently HOLDING' })
  declare ordersHolding: number;

  @ApiProperty({ description: 'Number of orders with RELEASED escrow' })
  declare ordersReleased: number;

  @ApiProperty({ description: 'Number of orders with REFUNDED escrow' })
  declare ordersRefunded: number;

  @ApiProperty({ description: 'Number of orders in DISPUTED state' })
  declare ordersDisputed: number;

  @ApiProperty({ description: 'Timestamp of this summary' })
  declare generatedAt: string;
}
