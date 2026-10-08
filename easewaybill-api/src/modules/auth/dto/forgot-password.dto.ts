import { IsNotEmpty, IsString, IsEmail, MaxLength, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address to send the password reset link to',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'A valid email address is required' })
  @IsNotEmpty()
  @MaxLength(254) // RFC 5321 max email length
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'One-time password reset token sent to the user email',
    example: 'a8f3c9e7b2d1...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20) // guards against trivially short/guessable tokens
  @MaxLength(512)
  token!: string;

  @ApiProperty({
    description: 'New password for the account',
    example: 'MyStrongPassword123!',
    minLength: 12,
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(128)
  @Matches(/(?=.*[a-z])/, { message: 'Password must contain a lowercase letter' })
  @Matches(/(?=.*[A-Z])/, { message: 'Password must contain an uppercase letter' })
  @Matches(/(?=.*\d)/, { message: 'Password must contain a number' })
  @Matches(/(?=.*[^A-Za-z0-9])/, { message: 'Password must contain a symbol' })
  newPassword!: string;
}
