import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { Room, RoomSchema } from './schemas/room.schema';
import { RoomTemplate, RoomTemplateSchema } from '../room-templates/schemas/room-template.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Room.name, schema: RoomSchema },
            { name: RoomTemplate.name, schema: RoomTemplateSchema },
            { name: Tenant.name, schema: TenantSchema },
        ]),
    ],
    controllers: [RoomsController],
    providers: [RoomsService],
    exports: [RoomsService],
})
export class RoomsModule { }

