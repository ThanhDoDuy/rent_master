import { IsString, IsNotEmpty, Matches, Length } from 'class-validator';

export class VerifyTOTPDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otpCode: string;
}