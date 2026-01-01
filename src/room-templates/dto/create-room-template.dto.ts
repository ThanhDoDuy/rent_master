import { IsString, IsNumber, IsOptional, IsNotEmpty, IsArray, ValidateNested, IsIn, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

class ServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['METERED', 'FIXED'])
  type: string; // 'METERED' or 'FIXED'

  @ValidateIf((o) => o.type === 'METERED')
  @IsString()
  @IsNotEmpty()
  unit?: string; // Required for METERED type

  @ValidateIf((o) => o.type === 'METERED')
  @IsNumber()
  @IsNotEmpty()
  unitPrice?: number; // Required for METERED type

  @ValidateIf((o) => o.type === 'FIXED')
  @IsNumber()
  @IsNotEmpty()
  amount?: number; // Required for FIXED type
}

export class CreateRoomTemplateDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  baseRent: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsNumber()
  @IsOptional()
  area?: number; // Area in m²

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services?: ServiceDto[];
}

