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
import { TerminateContractDto } from './dto/terminate-contract.dto';
import { ActivateContractDto } from './dto/activate-contract.dto';
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

  @Get('room/:roomId')
  async findByRoomId(@Param('roomId') roomId: string, @AccountId() accountId: string) {
    return this.contractsService.findByRoomId(roomId, accountId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @AccountId() accountId: string) {
    return this.contractsService.findOne(id, accountId);
  }

  @Post(':id/activate')
  async activate(
    @Param('id') id: string,
    @Body() activateDto: ActivateContractDto,
    @AccountId() accountId: string,
  ) {
    return this.contractsService.activate(id, activateDto, accountId);
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

