import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../schemas/user.schema';
import { UserSession, UserSessionDocument } from '../schemas/user-session.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserSession.name) private userSessionModel: Model<UserSessionDocument>,
    private configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'rentmaster-secret-key';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    const userId = payload.userId;
    const nonce = payload.nonce;

    if (!userId) {
      this.logger.error('Invalid token payload - no userId');
      throw new UnauthorizedException('Invalid token payload');
    }

    if (!nonce) {
      this.logger.error('Invalid token payload - no nonce');
      throw new UnauthorizedException('Invalid token payload - missing nonce');
    }

    // Check nonce in database
    const session = await this.userSessionModel.findOne({ nonce }).exec();
    if (!session) {
      this.logger.error(`Session not found for nonce: ${nonce}`);
      throw new UnauthorizedException('Invalid session');
    }

    // Check if session is expired
    if (session.expiredAt < new Date()) {
      this.logger.error(`Session expired for nonce: ${nonce}`);
      throw new UnauthorizedException('Session expired');
    }

    // Verify userId matches
    if (session.userId.toString() !== userId) {
      this.logger.error(`UserId mismatch: session.userId=${session.userId}, payload.userId=${userId}`);
      throw new UnauthorizedException('Invalid session');
    }

    // Get user information
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      this.logger.error(`User not found: ${userId}`);
      throw new UnauthorizedException('User not found');
    }

    return {
      userId: user._id.toString(),
      accountId: payload.accountId,
      role: payload.role || user.role,
    };
  }
}
