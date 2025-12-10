import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class MeterReadingItemDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsNumber()
  @Min(0)
  electricPrev: number;

  @IsNumber()
  @Min(0)
  electricCurr: number;

  @IsNumber()
  @Min(0)
  waterPrev: number;

  @IsNumber()
  @Min(0)
  waterCurr: number;
}

export class BulkMeterReadingDto {
  @IsString()
  @IsNotEmpty()
  billingPeriod: string; // Format: YYYY-MM

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeterReadingItemDto)
  readings: MeterReadingItemDto[];
}
