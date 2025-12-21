import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTenantDto {
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsOptional()
    documentType?: string;

    @IsString()
    @IsOptional()
    documentNumber?: string;
}

