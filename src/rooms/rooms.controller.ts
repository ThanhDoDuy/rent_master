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
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AccountId } from '../common/decorators/account-id.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) { }

    @Get('properties/:propertyId/rooms')
    async findAllByProperty(
        @Param('propertyId') propertyId: string,
        @AccountId() accountId: string,
    ) {
        const rooms = await this.roomsService.findAll(propertyId, accountId);
        return { rooms };
    }

    @Get('rooms/:id')
    async findOne(
        @Param('id') id: string,
        @AccountId() accountId: string,
    ) {
        return this.roomsService.findOne(id, accountId);
    }

    @Post('properties/:propertyId/rooms')
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Param('propertyId') propertyId: string,
        @Body() createRoomDto: CreateRoomDto,
        @AccountId() accountId: string,
    ) {
        return this.roomsService.create(propertyId, createRoomDto, accountId);
    }

    @Put('rooms/:id')
    async update(
        @Param('id') id: string,
        @Body() updateRoomDto: UpdateRoomDto,
        @AccountId() accountId: string,
    ) {
        return this.roomsService.update(id, updateRoomDto, accountId);
    }

    @Delete('rooms/:id')
    async remove(
        @Param('id') id: string,
        @AccountId() accountId: string,
    ) {
        return this.roomsService.remove(id, accountId);
    }

    @Post('rooms/:id/occupants')
    @HttpCode(HttpStatus.OK)
    async addOccupant(
        @Param('id') roomId: string,
        @Body() body: { tenantId: string },
        @AccountId() accountId: string,
    ) {
        return this.roomsService.addOccupant(roomId, body.tenantId, accountId);
    }

    @Delete('rooms/:id/occupants/:tenantId')
    @HttpCode(HttpStatus.OK)
    async removeOccupant(
        @Param('id') roomId: string,
        @Param('tenantId') tenantId: string,
        @AccountId() accountId: string,
    ) {
        return this.roomsService.removeOccupant(roomId, tenantId, accountId);
    }
}

