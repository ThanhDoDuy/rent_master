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
import { RoomTemplatesService } from './room-templates.service';
import { CreateRoomTemplateDto } from './dto/create-room-template.dto';
import { UpdateRoomTemplateDto } from './dto/update-room-template.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AccountId } from '../common/decorators/account-id.decorator';

@Controller('room-templates')
@UseGuards(JwtAuthGuard)
export class RoomTemplatesController {
    constructor(private readonly roomTemplatesService: RoomTemplatesService) { }

    @Get()
    async findAll(@AccountId() accountId: string) {
        const templates = await this.roomTemplatesService.findAll(accountId);
        return { templates };
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @AccountId() accountId: string) {
        return this.roomTemplatesService.findOne(id, accountId);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() createRoomTemplateDto: CreateRoomTemplateDto,
        @AccountId() accountId: string,
    ) {
        return this.roomTemplatesService.create(createRoomTemplateDto, accountId);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateRoomTemplateDto: UpdateRoomTemplateDto,
        @AccountId() accountId: string,
    ) {
        return this.roomTemplatesService.update(id, updateRoomTemplateDto, accountId);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @AccountId() accountId: string) {
        return this.roomTemplatesService.remove(id, accountId);
    }
}

