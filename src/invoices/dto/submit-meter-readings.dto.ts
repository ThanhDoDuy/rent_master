import { IsArray, ValidateNested, IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class MeterReadingDto {
    @IsString()
    @IsNotEmpty()
    key: string;

    @IsNumber()
    @IsNotEmpty()
    endReading: number;
}

export class SubmitMeterReadingsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MeterReadingDto)
    readings: MeterReadingDto[];
}

