import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { AddTenantDto } from './dto/add-tenant.dto';
import { TerminateContractDto } from './dto/terminate-contract.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AccountId } from '../common/decorators/account-id.decorator';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createContractDto: CreateContractDto,
    @AccountId() accountId: string,
  ) {
    return this.contractsService.create(createContractDto, accountId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @AccountId() accountId: string) {
    return this.contractsService.findOne(id, accountId);
  }

  @Post(':id/tenants')
  async addTenant(
    @Param('id') id: string,
    @Body() addTenantDto: AddTenantDto,
    @AccountId() accountId: string,
  ) {
    return this.contractsService.addTenant(id, addTenantDto, accountId);
  }

  @Delete(':id/tenants/:tenantId')
  async removeTenant(
    @Param('id') id: string,
    @Param('tenantId') tenantId: string,
    @AccountId() accountId: string,
  ) {
    return this.contractsService.removeTenant(id, tenantId, accountId);
  }

  @Post(':id/activate')
  async activate(@Param('id') id: string, @AccountId() accountId: string) {
    return this.contractsService.activate(id, accountId);
  }

  @Post(':id/end')
  async end(@Param('id') id: string, @AccountId() accountId: string) {
    return this.contractsService.end(id, accountId);
  }

  @Post(':id/terminate')
  async terminate(
    @Param('id') id: string,
    @Body() terminateDto: TerminateContractDto,
    @AccountId() accountId: string,
  ) {
    return this.contractsService.terminate(id, terminateDto, accountId);
  }
}

