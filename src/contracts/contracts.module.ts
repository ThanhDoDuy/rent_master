import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { Contract, ContractSchema } from './schemas/contract.schema';
import { ContractTenant, ContractTenantSchema } from './schemas/contract-tenant.schema';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Contract.name, schema: ContractSchema },
            { name: ContractTenant.name, schema: ContractTenantSchema },
            { name: Room.name, schema: RoomSchema },
            { name: Tenant.name, schema: TenantSchema },
        ]),
    ],
    controllers: [ContractsController],
    providers: [ContractsService],
    exports: [ContractsService],
})
export class ContractsModule { }

