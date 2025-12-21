import { IsNumber, IsString, IsNotEmpty, IsDateString, IsIn, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
    @IsNumber()
    @IsNotEmpty()
    @Min(0.01)
    amount: number;

    @IsDateString()
    @IsNotEmpty()
    paidAt: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(['CASH', 'BANK_TRANSFER', 'CARD', 'OTHER'])
    method: string;

    @IsString()
    @IsOptional()
    note?: string;
}