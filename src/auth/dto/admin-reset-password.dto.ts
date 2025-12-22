import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export class AdminResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Admin key là bắt buộc' })
  adminKey: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email là bắt buộc' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới là bắt buộc' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}

