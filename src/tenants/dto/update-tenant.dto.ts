import { IsString, IsOptional } from 'class-validator';

export class UpdateTenantDto {
    @IsString()
    @IsOptional()
    fullName?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    documentType?: string;

    @IsString()
    @IsOptional()
    documentNumber?: string;
}