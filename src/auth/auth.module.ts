import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserSession, UserSessionSchema } from './schemas/user-session.schema';
import { Account, AccountSchema } from './schemas/account.schema';
import { User, UserSchema } from './schemas/user.schema';
import { RateLimiterHelper } from '../common/helpers/rate-limiter.helper';
import { OTPHelper } from 'src/common/helpers/otp.helper';
import { SmsModule } from 'src/sms/sms.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: UserSession.name, schema: UserSessionSchema },
      { name: Account.name, schema: AccountSchema },
      { name: User.name, schema: UserSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET') || 'rentmaster-secret-key';
        return {
          secret: jwtSecret,
          signOptions: { expiresIn: '7d' },
        };
      },
      inject: [ConfigService],
    }),
    SmsModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    OTPHelper,
    {
      provide: 'SEND_OTP_RATE_LIMITER',
      useFactory: () => {
        return new RateLimiterHelper('send-otp', 6, 300);
      },
    }
  ],
  exports: [AuthService],
})
export class AuthModule {}
