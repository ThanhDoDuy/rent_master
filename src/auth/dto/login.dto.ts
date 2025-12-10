import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export interface LoginDataResponse {
  sessionToken: string;
  options: any;
  sessionCookieName: string;
  tenantId: string;
}

export interface AuthDataResponse {
  sessionToken: string;
  tenantId: string;
}
