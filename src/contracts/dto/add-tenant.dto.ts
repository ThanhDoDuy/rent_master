import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class AddTenantDto {
    @IsString()
    @IsNotEmpty()
    tenantId: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(['PRIMARY', 'OCCUPANT'])
    role: string;
}

