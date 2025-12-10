import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Tenant, TenantDocument } from './schemas/tenant.schema';
import { UserSession, UserSessionDocument } from './schemas/user-session.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDataResponse, LoginDto } from './dto/login.dto';
import { v4 as uuidv4 } from 'uuid';
import { CookieHelper } from '../common/helpers/cookie.helper';
import { RateLimiterHelper } from '../common/helpers/rate-limiter.helper';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(UserSession.name)
    private userSessionModel: Model<UserSessionDocument>,
    private jwtService: JwtService,
    private cookieHelper: CookieHelper,
    @Inject('LOGIN_RATE_LIMITER') private readonly rateLimiter: RateLimiterHelper,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ accessToken: string }> {
    const { name, email, phone, password } = registerDto;

    // Check if tenant already exists
    const existingTenant = await this.tenantModel.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingTenant) {
      throw new ConflictException('Email or phone already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create tenant
    const tenant = await this.tenantModel.create({
      name,
      email,
      phone,
      passwordHash,
      countryCode: 'VN',
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
    });

    // Generate JWT token
    const payload = {
      sub: tenant._id.toString(),
      tenantId: tenant._id.toString(),
      role: 'LANDLORD',
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async login(loginDto: LoginDto): Promise<LoginDataResponse> {
    try {
      Logger.log('AuthService login => start', {
        data: { email: loginDto.email },
      });

      // Rate limiting
      await this.rateLimiter.consume(`login:${loginDto.email.toLowerCase()}`);

      // Find tenant by email
      const tenant = await this.tenantModel
        .findOne({
          email: loginDto.email.toLowerCase(),
        })
        .select(['_id', 'passwordHash', 'email', 'name'])
        .exec();

      if (!tenant) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const { passwordHash } = tenant;

      // Verify password
      const isSame = await bcrypt.compare(loginDto.password, passwordHash);

      if (!isSame) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const data = {
        tenantId: tenant._id.toString(),
        email: tenant.email,
      };

      return await this._generateLoginJWT(data);
    } catch (err) {
      Logger.warn('AuthService login => failed', {
        data: { email: loginDto.email },
        error: { message: err?.message, stack: err?.stack },
      });
      throw err;
    }
  }

  async getMe(tenantId: string): Promise<TenantDocument | null> {
    return this.tenantModel.findById(tenantId).select('-passwordHash').exec();
  }

  async _generateLoginJWT(_data: any): Promise<LoginDataResponse> {
    try {
      Logger.log('AuthService generateLoginJWT => start', { data: _data });
      const nonce = uuidv4();

      // Save session to database
      await this.userSessionModel.create({
        tenantId: new Types.ObjectId(_data.tenantId),
        nonce,
      });

      const payload = {
        nonce,
        tenantId: _data.tenantId,
        email: _data.email,
        role: 'LANDLORD',
      };

      const sessionToken = await this.jwtService.signAsync(payload);
      const { options, sessionCookieName } = this.cookieHelper.getOptions();

      return {
        sessionToken,
        options,
        sessionCookieName,
        tenantId: _data.tenantId,
      };
    } catch (err) {
      Logger.error('AuthService generateLoginJWT => failed', {
        error: {
          message: err.message,
          stack: err.stack,
          data: _data,
        },
      });
      throw err;
    }
  }
}
