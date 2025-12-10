import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsService {
  async sendOtp(phone: string, otpCode: string): Promise<void> {
    // Mock SMS service - in production, integrate with SMS provider (Twilio, AWS SNS, etc.)
    console.log(`[SMS] Sending OTP to ${phone}: ${otpCode}`);
    // Simulate async operation
    return Promise.resolve();
  }
}

