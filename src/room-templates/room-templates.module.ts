import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomTemplatesController } from './room-templates.controller';
import { RoomTemplatesService } from './room-templates.service';
import { RoomTemplate, RoomTemplateSchema } from './schemas/room-template.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: RoomTemplate.name, schema: RoomTemplateSchema },
        ]),
    ],
    controllers: [RoomTemplatesController],
    providers: [RoomTemplatesService],
    exports: [RoomTemplatesService],
})
export class RoomTemplatesModule { }

