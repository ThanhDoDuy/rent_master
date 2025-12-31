import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AccountId } from '../common/decorators/account-id.decorator';

@Controller('properties')
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async findAll(@AccountId() accountId: string) {
    return this.propertiesService.findAll(accountId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @AccountId() accountId: string) {
    return this.propertiesService.findOne(id, accountId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @AccountId() accountId: string,
  ) {
    return this.propertiesService.create(createPropertyDto, accountId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @AccountId() accountId: string,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, accountId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @AccountId() accountId: string) {
    return this.propertiesService.remove(id, accountId);
  }
}

