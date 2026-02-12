import { IsBoolean, IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AmenityToggleItem {
  @ApiProperty()
  @IsString()
  amenityItemId: string;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}

export class BulkSetAmenitiesDto {
  @ApiProperty({ type: [AmenityToggleItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AmenityToggleItem)
  amenities: AmenityToggleItem[];
}

export class ToggleAmenityDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}
