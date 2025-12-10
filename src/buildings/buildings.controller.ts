import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('buildings')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  create(
    @TenantId() tenantId: string,
    @Body() createBuildingDto: CreateBuildingDto,
  ) {
    return this.buildingsService.create(tenantId, createBuildingDto);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.buildingsService.findAll(tenantId);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe())
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateBuildingDto: UpdateBuildingDto,
  ) {
    return this.buildingsService.update(tenantId, id, updateBuildingDto);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.buildingsService.remove(tenantId, id);
  }
}
