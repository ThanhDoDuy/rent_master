import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TenantProfilesService } from './tenant-profiles.service';
import { CreateTenantProfileDto } from './dto/create-tenant-profile.dto';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('tenant-profiles')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TenantProfilesController {
  constructor(
    private readonly tenantProfilesService: TenantProfilesService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe())
  create(
    @TenantId() tenantId: string,
    @Body() createTenantProfileDto: CreateTenantProfileDto,
  ) {
    return this.tenantProfilesService.create(tenantId, createTenantProfileDto);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.tenantProfilesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.tenantProfilesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe())
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateTenantProfileDto: UpdateTenantProfileDto,
  ) {
    return this.tenantProfilesService.update(
      tenantId,
      id,
      updateTenantProfileDto,
    );
  }
}
