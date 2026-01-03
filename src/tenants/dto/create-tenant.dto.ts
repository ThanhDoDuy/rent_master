import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, Matches, ValidateIf } from 'class-validator';

export class CreateTenantDto {
    @IsString()
    @IsNotEmpty({ message: 'Họ và tên không được để trống' })
    @MinLength(2, { message: 'Họ và tên phải có ít nhất 2 ký tự' })
    @MaxLength(100, { message: 'Họ và tên không được vượt quá 100 ký tự' })
    fullName: string;

    @IsString()
    @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
    @Matches(/^0[3-9]\d{8,9}$/, { 
        message: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0)' 
    })
    phone: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o) => o.documentType !== undefined && o.documentType !== null)
    @Matches(/^(CCCD|PASSPORT)$/, { 
        message: 'Loại giấy tờ phải là CCCD hoặc PASSPORT' 
    })
    documentType?: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o) => o.documentNumber !== undefined && o.documentNumber !== null)
    @MinLength(1, { message: 'Số giấy tờ không được để trống' })
    documentNumber?: string;
}

