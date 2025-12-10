import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument, InvoiceStatus, InvoiceItem } from '../invoices/schemas/invoice.schema';
import { Contract, ContractDocument, ContractStatus } from '../contracts/schemas/contract.schema';
import { Room, RoomDocument, RoomStatus } from '../rooms/schemas/room.schema';
import { MeterReading, MeterReadingDocument } from '../meter-readings/schemas/meter-reading.schema';

export class RunBillingDto {
  billingPeriod: string; // Format: YYYY-MM
  issueDate: Date;
  dueDate: Date;
}

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @InjectModel(MeterReading.name)
    private meterReadingModel: Model<MeterReadingDocument>,
  ) {}

  async runBilling(
    tenantId: string,
    runBillingDto: RunBillingDto,
  ): Promise<{ billingPeriod: string; createdCount: number; skippedCount: number }> {
    const { billingPeriod, issueDate, dueDate } = runBillingDto;

    // Get all OCCUPIED rooms for this tenant
    const occupiedRooms = await this.roomModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        status: RoomStatus.OCCUPIED,
      })
      .exec();

    let createdCount = 0;
    let skippedCount = 0;

    for (const room of occupiedRooms) {
      // Check idempotency: if invoice exists for roomId & billingPeriod → skip
      const existingInvoice = await this.invoiceModel
        .findOne({
          tenantId: new Types.ObjectId(tenantId),
          roomId: room._id,
          billingPeriod,
        })
        .exec();

      if (existingInvoice) {
        skippedCount++;
        continue;
      }

      // Get matching meterReading
      const meterReading = await this.meterReadingModel
        .findOne({
          tenantId: new Types.ObjectId(tenantId),
          roomId: room._id,
          billingPeriod,
        })
        .exec();

      // Get active contract for this room
      const contract = await this.contractModel
        .findOne({
          tenantId: new Types.ObjectId(tenantId),
          roomId: room._id,
          status: ContractStatus.ACTIVE,
        })
        .exec();

      // Calculate items
      const items: InvoiceItem[] = [];

      // RENT = room.baseRent
      items.push({
        type: 'RENT',
        description: `Tiền thuê phòng ${room.name}`,
        quantity: 1,
        unitPrice: room.baseRent,
        amount: room.baseRent,
      });

      // ELECTRICITY = electricConsumption * room.services.electricityRate
      if (meterReading && room.services.electricityRate > 0) {
        const electricityAmount =
          meterReading.electricConsumption * room.services.electricityRate;
        items.push({
          type: 'ELECTRICITY',
          description: `Điện (${meterReading.electricConsumption} số)`,
          quantity: meterReading.electricConsumption,
          unitPrice: room.services.electricityRate,
          amount: electricityAmount,
        });
      }

      // WATER = waterConsumption * room.services.waterRate
      if (meterReading && room.services.waterRate > 0) {
        const waterAmount =
          meterReading.waterConsumption * room.services.waterRate;
        items.push({
          type: 'WATER',
          description: `Nước (${meterReading.waterConsumption} số)`,
          quantity: meterReading.waterConsumption,
          unitPrice: room.services.waterRate,
          amount: waterAmount,
        });
      }

      // Calculate totalAmount
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

      // Create invoice snapshot
      const invoice = new this.invoiceModel({
        tenantId: new Types.ObjectId(tenantId),
        roomId: room._id,
        contractId: contract?._id,
        billingPeriod,
        totalAmount,
        paidAmount: 0,
        status: InvoiceStatus.DRAFT,
        items,
        issueDate,
        dueDate,
      });

      await invoice.save();
      createdCount++;
    }

    return {
      billingPeriod,
      createdCount,
      skippedCount,
    };
  }
}
