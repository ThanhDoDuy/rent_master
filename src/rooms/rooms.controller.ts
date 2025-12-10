import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('rooms')
@UseGuards(JwtAuthGuard, TenantGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  create(@TenantId() tenantId: string, @Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(tenantId, createRoomDto);
  }

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('buildingId') buildingId?: string,
  ) {
    return this.roomsService.findAll(tenantId, buildingId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.roomsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe())
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(tenantId, id, updateRoomDto);
  }
}
