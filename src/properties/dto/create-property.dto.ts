import { IsString, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PropertyCategory } from '@prisma/client';

export class CreatePropertyDto {
  @ApiProperty({ example: 'The Meridian Grand Hotel' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: '455 Madison Avenue, New York, NY 10022' })
  @IsString()
  @MinLength(5)
  address: string;

  @ApiProperty({ example: 'Lekki Phase 1' })
  @IsString()
  area: string;

  @ApiProperty({ enum: PropertyCategory, example: 'HOTEL' })
  @IsEnum(PropertyCategory)
  category: PropertyCategory;

  @ApiProperty({ example: 'A beautiful hotel in the heart of the city...' })
  @IsString()
  @MinLength(20)
  description: string;
}
