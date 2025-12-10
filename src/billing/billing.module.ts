import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingCronService } from './billing.cron';
import { Invoice, InvoiceSchema } from '../invoices/schemas/invoice.schema';
import { Contract, ContractSchema } from '../contracts/schemas/contract.schema';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';
import {
  MeterReading,
  MeterReadingSchema,
} from '../meter-readings/schemas/meter-reading.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Room.name, schema: RoomSchema },
      { name: MeterReading.name, schema: MeterReadingSchema },
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService, BillingCronService],
  exports: [BillingService],
})
export class BillingModule {}
