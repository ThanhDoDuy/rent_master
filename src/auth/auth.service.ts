import {
  Injectable,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { UserSession, UserSessionDocument } from './schemas/user-session.schema';
import { Account, AccountDocument } from './schemas/account.schema';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiterHelper } from '../common/helpers/rate-limiter.helper';
import { SendOTPDto } from './dto/send-otp.dto';
import { OTPHelper } from 'src/common/helpers/otp.helper';
import { SmsService } from 'src/sms/sms.service';
import { VerifyTOTPDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import {
  AppBadRequestException,
} from '../common/exceptions/app.exception';
import { ErrorCode } from '../common/constants/error-codes';
import * as bcrypt from 'bcrypt';

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
    private readonly configService: ConfigService,
  ) {}

  async getMeUser(userId: string): Promise<{ id: string; email: string; phone?: string; role: string; accountId: string } | null> {
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
      email: user.email,
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

      // STEP 2: Find user (OTP flow is deprecated, users must register with email/password)
      const user = await this.userModel.findOne({ phone: dto.phone }).populate('accountId').exec();

      if (!user) {
        // User not found - OTP flow is deprecated, user must register with email/password
        throw new AppBadRequestException(ErrorCode.AUTH_USER_NOT_FOUND);
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

  async register(dto: RegisterDto): Promise<{ sessionToken: string; user: { id: string; email: string; role: string; accountId: string } }> {
    try {
      Logger.log('AuthService register => start', { email: dto.email });

      // Check if email already exists
      const existingUser = await this.userModel.findOne({ email: dto.email }).exec();
      if (existingUser) {
        throw new AppBadRequestException(ErrorCode.AUTH_EMAIL_ALREADY_EXISTS);
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

      // Create account
      const account = await this.accountModel.create({});

      // Create user
      const user = await this.userModel.create({
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
        role: UserRole.OWNER,
        accountId: account._id,
      });

      // Create session
      const nonce = uuidv4();
      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + 7); // 7 days expiration

      await this.userSessionModel.create({
        userId: user._id,
        nonce,
        expiredAt,
      });

      // Generate session token
      const payload = {
        userId: user._id.toString(),
        accountId: account._id.toString(),
        role: user.role,
        nonce,
      };

      const sessionToken = await this.jwtService.signAsync(payload);

      return {
        sessionToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          accountId: account._id.toString(),
        },
      };
    } catch (error) {
      Logger.error('AuthService register => failed', {
        error: {
          message: error.message,
          stack: error.stack,
          data: dto,
        },
      });
      if (error instanceof AppBadRequestException) {
        throw error;
      }
      throw new AppBadRequestException(ErrorCode.GENERIC_INTERNAL_SERVER_ERROR);
    }
  }

  async login(dto: LoginDto): Promise<{ sessionToken: string; user: { id: string; email: string; role: string; accountId: string } }> {
    try {
      Logger.log('AuthService login => start', { email: dto.email });

      // Find user by email
      const user = await this.userModel.findOne({ email: dto.email }).populate('accountId').exec();
      if (!user) {
        throw new AppBadRequestException(ErrorCode.AUTH_INVALID_CREDENTIALS);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new AppBadRequestException(ErrorCode.AUTH_INVALID_CREDENTIALS);
      }

      // Create session
      const nonce = uuidv4();
      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + 7); // 7 days expiration

      await this.userSessionModel.create({
        userId: user._id,
        nonce,
        expiredAt,
      });

      // Generate session token
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
          email: user.email,
          role: user.role,
          accountId,
        },
      };
    } catch (error) {
      Logger.error('AuthService login => failed', {
        error: {
          message: error.message,
          stack: error.stack,
          data: dto,
        },
      });
      if (error instanceof AppBadRequestException) {
        throw error;
      }
      throw new AppBadRequestException(ErrorCode.AUTH_INVALID_CREDENTIALS);
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    try {
      Logger.log('AuthService changePassword => start', { userId });

      // Find user
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new AppBadRequestException(ErrorCode.AUTH_USER_NOT_FOUND);
      }

      // Verify old password
      const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, user.password);
      if (!isOldPasswordValid) {
        throw new AppBadRequestException(ErrorCode.AUTH_OLD_PASSWORD_INCORRECT);
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(dto.newPassword, saltRounds);

      // Update password
      user.password = hashedNewPassword;
      await user.save();

      Logger.log('AuthService changePassword => success', { userId });

      return {
        message: 'Đổi mật khẩu thành công',
      };
    } catch (error) {
      Logger.error('AuthService changePassword => failed', {
        error: {
          message: error.message,
          stack: error.stack,
          userId,
        },
      });
      if (error instanceof AppBadRequestException) {
        throw error;
      }
      throw new AppBadRequestException(ErrorCode.GENERIC_INTERNAL_SERVER_ERROR);
    }
  }

  async adminResetPassword(dto: AdminResetPasswordDto): Promise<{ message: string }> {
    try {
      Logger.log('AuthService adminResetPassword => start', { email: dto.email });

      // Verify admin key
      const adminKey = this.configService.get<string>('ADMIN_RESET_PASSWORD_KEY');
      if (!adminKey || dto.adminKey !== adminKey) {
        throw new AppBadRequestException(ErrorCode.AUTH_ADMIN_KEY_INVALID);
      }

      // Find user by email
      const user = await this.userModel.findOne({ email: dto.email }).exec();
      if (!user) {
        throw new AppBadRequestException(ErrorCode.AUTH_USER_NOT_FOUND);
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(dto.newPassword, saltRounds);

      // Update password
      user.password = hashedNewPassword;
      await user.save();

      Logger.log('AuthService adminResetPassword => success', { email: dto.email });

      return {
        message: 'Đặt lại mật khẩu thành công',
      };
    } catch (error) {
      Logger.error('AuthService adminResetPassword => failed', {
        error: {
          message: error.message,
          stack: error.stack,
          email: dto.email,
        },
      });
      if (error instanceof AppBadRequestException) {
        throw error;
      }
      throw new AppBadRequestException(ErrorCode.GENERIC_INTERNAL_SERVER_ERROR);
    }
  }
}
