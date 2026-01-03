import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { BulkDeleteTenantsDto } from './dto/bulk-delete-tenants.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AccountId } from '../common/decorators/account-id.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Get()
    async findAll(
        @AccountId() accountId: string,
        @Query('excludeRoomId') excludeRoomId?: string,
    ) {
        const tenants = await this.tenantsService.findAll(accountId, excludeRoomId);
        return { tenants };
    }

    @Get(':id')
    async findOne(
        @Param('id') id: string,
        @AccountId() accountId: string,
    ) {
        return this.tenantsService.findOne(id, accountId);
    }

    @Get(':id/contracts')
    async getContractHistory(
        @Param('id') id: string,
        @AccountId() accountId: string,
    ) {
        const contracts = await this.tenantsService.getContractHistory(id, accountId);
        return { contracts };
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() createTenantDto: CreateTenantDto,
        @AccountId() accountId: string,
    ) {
        return this.tenantsService.create(createTenantDto, accountId);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateTenantDto: UpdateTenantDto,
        @AccountId() accountId: string,
    ) {
        return this.tenantsService.update(id, updateTenantDto, accountId);
    }

    @Delete('bulk')
    @HttpCode(HttpStatus.OK)
    async bulkRemove(
        @Body() bulkDeleteDto: BulkDeleteTenantsDto,
        @AccountId() accountId: string,
    ) {
        return this.tenantsService.bulkRemove(bulkDeleteDto.tenantIds, accountId);
    }

    @Delete(':id')
    async remove(
        @Param('id') id: string,
        @AccountId() accountId: string,
    ) {
        return this.tenantsService.remove(id, accountId);
    }
}

