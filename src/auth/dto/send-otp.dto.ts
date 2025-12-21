import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class SendOTPDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(0\d{9}|\+84\d{9}|\+1\d{10})$/, {
    message: 'Phone number must be Vietnamese format (0xxxxxxxxx or +84xxxxxxxxx) or US/Canada format (+1xxxxxxxxxx)',
  })
  phone: string;
}

export class ResendOTPDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(0\d{9}|\+84\d{9}|\+1\d{10})$/, {
    message: 'Phone number must be Vietnamese format (0xxxxxxxxx or +84xxxxxxxxx) or US/Canada format (+1xxxxxxxxxx)',
  })
  phone: string;
}
