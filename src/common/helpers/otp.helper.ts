import { Injectable, Logger } from '@nestjs/common';
import * as OTPAuth from 'otpauth';

@Injectable()
export class OTPHelper {
  private secret: string;

  constructor() {
    this.secret = process.env.OTP_SECRET || 'JBSWY3DPEHPK3PXP';
  }

  public async generateTOTP(secretPrefix = ''): Promise<string> {
    const secret: OTPAuth.Secret = OTPAuth.Secret.fromUTF8(
      `${secretPrefix}${this.secret}`,
    );
    const totp = new OTPAuth.TOTP({
      secret: secret,
      digits: 6,
      period: 300,
      algorithm: 'SHA-1',
    });
    const otp = totp.generate();
    Logger.log('OTPHelper generateTOTP => otp');
    return otp;
  }

  public async verifyTOTP(token: string, secretPrefix = ''): Promise<boolean> {
    const secret: OTPAuth.Secret = OTPAuth.Secret.fromUTF8(
      `${secretPrefix}${this.secret}`,
    );
    const totp = new OTPAuth.TOTP({
      secret: secret,
      digits: 6,
      period: 300,
      algorithm: 'SHA-1',
    });
    const window = 1;
    const result = totp.validate({ token, window }) !== null;

    return result;
  }
}
