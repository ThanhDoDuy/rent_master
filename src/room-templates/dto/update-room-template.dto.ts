import { IsString, IsNumber, IsOptional, IsNotEmpty, IsArray, ValidateNested, IsIn, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

class ServiceDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    @IsIn(['METERED', 'FIXED'])
    type?: string; // 'METERED' or 'FIXED'

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

export class UpdateRoomTemplateDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @IsOptional()
    baseRent?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  area?: number; // Area in m²

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services?: ServiceDto[];
}

