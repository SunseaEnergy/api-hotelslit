import { IsString, IsNumber, IsOptional, IsBoolean, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: 'Deluxe Suite' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'Entire Apartment' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'Double bed' })
  @IsString()
  bedType: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  beds: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  baths: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  maxGuests: number;

  @ApiProperty({ example: 365 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: '(Includes tax and charges)' })
  @IsOptional()
  @IsString()
  priceNote?: string;

  @ApiPropertyOptional({ example: 'Lekki Phase 1' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
