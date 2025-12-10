import {
  Controller,
  Post,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { BillingService, RunBillingDto } from './billing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

class RunBillingRequestDto {
  @IsString()
  @IsNotEmpty()
  billingPeriod: string;

  @IsDateString()
  @IsNotEmpty()
  issueDate: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;
}

@Controller('billing')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('run')
  @UsePipes(new ValidationPipe())
  runBilling(
    @TenantId() tenantId: string,
    @Body() runBillingDto: RunBillingRequestDto,
  ) {
    return this.billingService.runBilling(tenantId, {
      billingPeriod: runBillingDto.billingPeriod,
      issueDate: new Date(runBillingDto.issueDate),
      dueDate: new Date(runBillingDto.dueDate),
    });
  }
}
