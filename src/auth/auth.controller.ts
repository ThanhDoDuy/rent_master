import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserGuard } from '../common/guards/user.guard';
import { UserId } from '../common/decorators/user-id.decorator';
import { ResendOTPDto, SendOTPDto } from './dto/send-otp.dto';
import { VerifyTOTPDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, UserGuard)
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
}
