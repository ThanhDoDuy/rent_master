import { IsString, IsOptional } from 'class-validator';

export class TerminateContractDto {
    @IsString()
    @IsOptional()
    reason?: string;
}

