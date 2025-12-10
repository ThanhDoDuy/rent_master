import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Patch,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('contracts')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  create(
    @TenantId() tenantId: string,
    @Body() createContractDto: CreateContractDto,
  ) {
    return this.contractsService.create(tenantId, createContractDto);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.contractsService.findAll(tenantId);
  }

  @Patch(':id/end')
  endContract(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contractsService.endContract(tenantId, id);
  }
}
