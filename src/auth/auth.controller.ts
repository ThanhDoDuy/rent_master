import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  HttpCode,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, AuthDataResponse } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { TransformInterceptor } from '../common/interceptors/response.interceptor';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @UsePipes(new ValidationPipe())
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @HttpCode(200)
  @UseInterceptors(TransformInterceptor)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response,
  ): Promise<{ message: string }> {
    const {
      sessionToken,
      options,
      sessionCookieName,
      tenantId,
    } = await this.authService.login(loginDto);

    response.cookie(sessionCookieName, sessionToken, options);
    response.cookie('tenantId', tenantId, options);

    return { message: 'ok' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getMe(@TenantId() tenantId: string) {
    return this.authService.getMe(tenantId);
  }
}
