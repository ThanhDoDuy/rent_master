import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTenantProfileDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  idNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
