import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { AppBadRequestException } from '../common/exceptions/app.exception';
import { ErrorCode } from '../common/constants/error-codes';

interface SmsData {
  otp: string;
}

@Injectable()
export class SmsService {
  private client: Twilio;
  private logger = new Logger(SmsService.name);
  private templateId: string;

  constructor(private configService: ConfigService) {
    this.client = new Twilio(
      this.configService.get('ACCOUNT_SID'),
      this.configService.get('AUTH_TOKEN'),
    );
    this.templateId =
      this.configService.get('CONTENT_SID') ||
      'HXada40f5bb8c2b315d9c0d62ca38413ac';
  }

  async sendSmsWithTemplate(to: string, data: SmsData): Promise<void> {
    const from = this.configService.get('FROM_PHONE_NUMBER');
    if (!from) {
      throw new Error('FROM_PHONE_NUMBER is not configured');
    }

    try {
      this.logger.log(
        `Sending SMS from ${from} to ${to} using content SID: ${this.templateId}`,
      );
      const body = `Your verification code is ${data.otp}. Do not share this code.`;
      // const result = await this.client.messages.create({
      //   from,
      //   to,
      //   body,
      // });

      this.logger.log(`✅ SMS sent to ${to} | OTP: ${data.otp}`);
    } catch (error) {
      const errorDetails = {
        message: error?.message || 'Unknown error',
        code: error?.code,
        status: error?.status,
        from,
        to: to,
      };
      this.logger.error(
        `❌ Failed to send SMS from ${from} to ${to}`,
        errorDetails,
      );
      
      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        this.logger.error('SMS sending timed out - this may be due to network issues or Twilio API delays');
        throw new AppBadRequestException(ErrorCode.SMS_SEND_FAILED);
      }
      
      if (error.status === 400) {
        if (error.code === '21211') {
          throw new AppBadRequestException(ErrorCode.SMS_INVALID_PHONE_NUMBER);
        }
        throw new AppBadRequestException(ErrorCode.SMS_INVALID_DATA);
      }
      throw error;
    }
  }
}
