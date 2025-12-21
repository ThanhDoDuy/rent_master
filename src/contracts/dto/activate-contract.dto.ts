import { IsArray, ValidateNested, IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class InitialMeterReadingDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsNumber()
  @IsNotEmpty()
  reading: number;
}

export class ActivateContractDto {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InitialMeterReadingDto)
  initialMeterReadings?: InitialMeterReadingDto[];
}

