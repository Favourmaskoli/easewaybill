import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Message body',
    example: 'Item is ready for pickup at the warehouse.',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Message body cannot be empty' })
  @MinLength(1)
  @MaxLength(2000, { message: 'Message cannot exceed 2000 characters' })
  declare body: string;
}

export class MessageSenderDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare firstName: string;
  @ApiProperty() declare lastName: string;
  @ApiProperty() declare role: string;
}

export class MessageResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare orderId: string;
  @ApiProperty() declare body: string;
  @ApiProperty() declare createdAt: Date;
  @ApiProperty({ type: MessageSenderDto }) declare sender: MessageSenderDto;
}

export class MessageListResponseDto {
  @ApiProperty({ type: [MessageResponseDto] })
  declare messages: MessageResponseDto[];

  @ApiProperty() declare total: number;
  @ApiProperty() declare hasNextPage: boolean;
  @ApiPropertyOptional() nextCursor?: string | null;
}
