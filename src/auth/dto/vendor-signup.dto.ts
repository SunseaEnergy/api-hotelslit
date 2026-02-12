import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VendorSignupDto {
  @ApiProperty({ example: 'The Meridian Grand Hotel' })
  @IsString()
  @MinLength(2)
  businessName: string;

  @ApiProperty({ example: 'vendor@hotel.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '08012345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;
}
