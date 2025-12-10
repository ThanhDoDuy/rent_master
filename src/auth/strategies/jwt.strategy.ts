import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';
import { CookieHelper } from '../../common/helpers/cookie.helper';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  private cookieHelper: CookieHelper;

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    private configService: ConfigService,
  ) {
    const cookieHelper = new CookieHelper();
    const { sessionCookieName } = cookieHelper.getOptions();
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'rentmaster-secret-key';

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try to extract from Authorization header first (skip if "null" or empty)
        (request: Request) => {
          const authHeader = request.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7).trim();
            if (token && token !== 'null' && token !== '') {
              return token;
            }
          }
          return null;
        },
        // Fallback to cookie
        (request: Request) => {
          const cookieToken = request?.cookies?.[sessionCookieName];
          if (cookieToken) {
            return cookieToken;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });

    this.cookieHelper = cookieHelper;
    this.logger.log(`JWT Secret loaded: ${jwtSecret.substring(0, 10)}...`);
  }

  async validate(payload: any) {
    // JWT payload contains: nonce, tenantId, email, role
    // Use tenantId instead of sub
    const tenantId = payload.tenantId || payload.sub;

    if (!tenantId) {
      this.logger.error('Invalid token payload - no tenantId');
      throw new UnauthorizedException('Invalid token payload');
    }

    const tenant = await this.tenantModel.findById(tenantId).exec();
    if (!tenant) {
      this.logger.error(`Tenant not found: ${tenantId}`);
      throw new UnauthorizedException('Tenant not found');
    }

    return {
      tenantId,
      email: payload.email,
      role: payload.role,
    };
  }
}
