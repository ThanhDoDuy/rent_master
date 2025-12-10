import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly-revenue')
  getMonthlyRevenue(
    @TenantId() tenantId: string,
    @Query('billingPeriod') billingPeriod: string,
  ) {
    return this.reportsService.getMonthlyRevenue(tenantId, billingPeriod);
  }

  @Get('debts')
  getDebts(@TenantId() tenantId: string) {
    return this.reportsService.getDebts(tenantId);
  }

  @Get('occupancy')
  getOccupancy(@TenantId() tenantId: string) {
    return this.reportsService.getOccupancy(tenantId);
  }
}
