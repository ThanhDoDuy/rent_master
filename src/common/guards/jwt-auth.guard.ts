import {
  Injectable,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AppUnauthorizedException } from '../exceptions/app.exception';
import { ErrorCode } from '../constants/error-codes';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err) {
      this.logger.error('JWT Auth error:', err.message);
      throw err;
    }
    if (!user) {
      this.logger.warn('JWT Auth failed - no user:', info?.message || 'Unknown error');
      throw new AppUnauthorizedException(ErrorCode.AUTH_TOKEN_INVALID_OR_EXPIRED);
    }
    return user;
  }
}

