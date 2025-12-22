import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserId } from '../common/decorators/user-id.decorator';
import { ResendOTPDto, SendOTPDto } from './dto/send-otp.dto';
import { VerifyTOTPDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@UserId() userId: string) {
    return this.authService.getMeUser(userId);
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOTP(@Body() dto: SendOTPDto) {
    return this.authService.sendOTP(dto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOTP(@Body() dto: ResendOTPDto) {
    return this.authService.sendOTP(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyTOTP(@Body() dto: VerifyTOTPDto) {
    return this.authService.verifyTOTP(dto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@UserId() userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }

  @Put('admin/reset-password')
  @HttpCode(HttpStatus.OK)
  async adminResetPassword(@Body() dto: AdminResetPasswordDto) {
    return this.authService.adminResetPassword(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    return this.authService.logout(req);
  }
}
