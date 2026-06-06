import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty({
    example: 'cmpemln5i0000569kj79v3pv3',
    description: 'Order ID to initiate payment for',
  })
  @IsString()
  @IsNotEmpty()
  declare orderId: string;

  @ApiPropertyOptional({
    example: 'buyer@easewaybill.com',
    description: 'Buyer email for Paystack — defaults to authenticated user email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'https://easewaybill.com/payment/callback',
    description: 'URL Paystack redirects to after payment',
  })
  @IsOptional()
  @IsString()
  callbackUrl?: string;
}
