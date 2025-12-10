import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Tenant, TenantSchema } from './schemas/tenant.schema';
import { UserSession, UserSessionSchema } from './schemas/user-session.schema';
import { CookieHelper } from '../common/helpers/cookie.helper';
import { RateLimiterHelper } from '../common/helpers/rate-limiter.helper';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: UserSession.name, schema: UserSessionSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET') || 'rentmaster-secret-key';
        console.log(`[AuthModule] JWT Secret loaded: ${jwtSecret.substring(0, 10)}...`);
        return {
          secret: jwtSecret,
          signOptions: { expiresIn: '7d' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    CookieHelper,
    {
      provide: 'LOGIN_RATE_LIMITER',
      useFactory: () => new RateLimiterHelper('auth:rate-limiter:', 6, 300), // 6 requests per 5 minutes
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
