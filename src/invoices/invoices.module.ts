import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { Contract, ContractSchema } from '../contracts/schemas/contract.schema';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Invoice.name, schema: InvoiceSchema },
            { name: Contract.name, schema: ContractSchema },
            { name: Room.name, schema: RoomSchema },
        ]),
    ],
    controllers: [InvoicesController],
    providers: [InvoicesService],
    exports: [InvoicesService],
})
export class InvoicesModule { }

