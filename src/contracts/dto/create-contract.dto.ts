import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateContractDto {
    @IsString()
    @IsNotEmpty()
    roomId: string;

    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsDateString()
    @IsNotEmpty()
    endDate: string;

    @IsString()
    @IsNotEmpty()
    tenantId: string; // PRIMARY tenant ID (required)
}

