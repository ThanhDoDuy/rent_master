import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MeterReadingsService } from './meter-readings.service';
import { BulkMeterReadingDto } from './dto/bulk-meter-reading.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('meter-readings')
@UseGuards(JwtAuthGuard, TenantGuard)
export class MeterReadingsController {
  constructor(
    private readonly meterReadingsService: MeterReadingsService,
  ) {}

  @Post('bulk')
  @UsePipes(new ValidationPipe())
  bulkUpsert(
    @TenantId() tenantId: string,
    @Body() bulkMeterReadingDto: BulkMeterReadingDto,
  ) {
    return this.meterReadingsService.bulkUpsert(tenantId, bulkMeterReadingDto);
  }

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('roomId') roomId?: string,
    @Query('billingPeriod') billingPeriod?: string,
  ) {
    return this.meterReadingsService.findAll(tenantId, roomId, billingPeriod);
  }
}
