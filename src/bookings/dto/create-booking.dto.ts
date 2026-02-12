import { IsString, IsEmail, IsNumber, IsOptional, IsDateString, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty()
  @IsString()
  propertyId: string;

  @ApiProperty()
  @IsString()
  roomId: string;

  @ApiProperty({ example: 'Ayo Dahunsi' })
  @IsString()
  @MinLength(2)
  guestName: string;

  @ApiProperty({ example: 'ayo@email.com' })
  @IsEmail()
  guestEmail: string;

  @ApiProperty({ example: '09096631152' })
  @IsString()
  guestPhone: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  guests: number;

  @ApiProperty({ example: '2025-03-15' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2025-03-23' })
  @IsDateString()
  checkOut: string;

  @ApiProperty({ example: 'Entire Apartment' })
  @IsString()
  roomType: string;

  @ApiPropertyOptional({ example: 'Late check-in please' })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiPropertyOptional({ example: 'WELCOME10' })
  @IsOptional()
  @IsString()
  promoCode?: string;
}
