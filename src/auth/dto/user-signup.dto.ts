import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserSignupDto {
  @ApiProperty({ example: 'Ayo Dahunsi' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'ayo@email.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '09096631152' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;
}
