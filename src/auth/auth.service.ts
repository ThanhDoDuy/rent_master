import {
  Injectable,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSession, UserSessionDocument } from './schemas/user-session.schema';
import { Account, AccountDocument } from './schemas/account.schema';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiterHelper } from '../common/helpers/rate-limiter.helper';
import { SendOTPDto } from './dto/send-otp.dto';
import { OTPHelper } from 'src/common/helpers/otp.helper';
import { SmsService } from 'src/sms/sms.service';
import { VerifyTOTPDto } from './dto/verify-otp.dto';
import {
  AppBadRequestException,
} from '../common/exceptions/app.exception';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserSession.name)
    private userSessionModel: Model<UserSessionDocument>,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    @Inject('SEND_OTP_RATE_LIMITER') private readonly sendOtpRateLimiter: RateLimiterHelper,
    private readonly otpHelper: OTPHelper,
    private readonly smsService: SmsService,
  ) {}

  async getMeUser(userId: string): Promise<{ id: string; phone: string; role: string; accountId: string } | null> {
    const user = await this.userModel.findById(userId).populate('accountId').exec();
    
    if (!user) {
      return null;
    }

    const accountIdValue = user.accountId as any;
    const accountId = accountIdValue?._id 
      ? accountIdValue._id.toString() 
      : accountIdValue.toString();

    return {
      id: user._id.toString(),
      phone: user.phone,
      role: user.role,
      accountId,
    };
  }

  async sendOTP(dto: SendOTPDto): Promise<{ message: string }> {
    try {
      Logger.log('AuthService sendOTP => start');

      await this.sendOtpRateLimiter.consume(`sendOTP:${dto.phone}`, 1);
      const otp = await this.otpHelper.generateTOTP(dto.phone);
      // Send OTP via SMS with template (Twilio)
      await this.smsService.sendSmsWithTemplate(dto.phone, { otp });
      await this.sendOtpRateLimiter.block(`sendOTP:${dto.phone}`, 60);
      return {
        message: 'OTP sent successfully',
      };
    } catch (err) {
      Logger.error('AuthService sendOTP => failed', {
        error: {
          message: err.message,
          stack: err.stack,
          data: dto,
        },
      });
      throw err;
    }
  }

  async verifyTOTP(
    dto: VerifyTOTPDto,
  ): Promise<{ sessionToken: string; user: { id: string; role: string; accountId: string } }> {
    try {
      Logger.log('AuthService verifyTOTP => start', { phone: dto.phone });

      // STEP 1: Verify OTP using OTPHelper
      const isValid = await this.otpHelper.verifyTOTP(dto.otpCode, dto.phone);

      if (!isValid) {
        throw new AppBadRequestException(ErrorCode.AUTH_OTP_INVALID_OR_EXPIRED);
      }

      // STEP 2: Find or create user + account
      let user = await this.userModel.findOne({ phone: dto.phone }).populate('accountId').exec();

      if (!user) {
        // First-time user: Create account and user
        Logger.log('Creating new account and user for first-time login');
        const account = await this.accountModel.create({});
        
        user = await this.userModel.create({
          phone: dto.phone,
          role: UserRole.OWNER,
          accountId: account._id,
        });
        
        // Populate accountId for new user
        await user.populate('accountId');
      } else {
        // Existing user: account already loaded via populate
        Logger.log('User exists, account loaded');
      }

      // STEP 3: Create session
      const nonce = uuidv4();
      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + 7); // 7 days expiration

      await this.userSessionModel.create({
        userId: user._id,
        nonce,
        expiredAt,
      });

      // STEP 4: Generate session token
      // Get accountId - handle both populated and non-populated cases
      const accountIdValue = user.accountId as any;
      const accountId = accountIdValue?._id 
        ? accountIdValue._id.toString() 
        : accountIdValue.toString();

      const payload = {
        userId: user._id.toString(),
        accountId,
        role: user.role,
        nonce,
      };

      const sessionToken = await this.jwtService.signAsync(payload);

      return {
        sessionToken,
        user: {
          id: user._id.toString(),
          role: user.role,
          accountId,
        },
      };
    } catch (error) {
      Logger.error('AuthService verifyTOTP => failed', {
        error: {
          message: error.message,
          stack: error.stack,
          data: dto,
        },
      });
      if (error instanceof AppBadRequestException) {
        throw error;
      }
      throw new AppBadRequestException(ErrorCode.AUTH_OTP_VERIFY_FAILED);
    }
  }
}
