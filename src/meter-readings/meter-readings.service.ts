import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MeterReading, MeterReadingDocument } from './schemas/meter-reading.schema';
import { BulkMeterReadingDto } from './dto/bulk-meter-reading.dto';

@Injectable()
export class MeterReadingsService {
  constructor(
    @InjectModel(MeterReading.name)
    private meterReadingModel: Model<MeterReadingDocument>,
  ) {}

  async bulkUpsert(
    tenantId: string,
    bulkMeterReadingDto: BulkMeterReadingDto,
  ): Promise<MeterReadingDocument[]> {
    const { billingPeriod, readings } = bulkMeterReadingDto;
    const results: MeterReadingDocument[] = [];

    for (const reading of readings) {
      // Validate curr >= prev
      if (reading.electricCurr < reading.electricPrev) {
        throw new BadRequestException(
          `Electric current reading (${reading.electricCurr}) must be >= previous reading (${reading.electricPrev}) for room ${reading.roomId}`,
        );
      }

      if (reading.waterCurr < reading.waterPrev) {
        throw new BadRequestException(
          `Water current reading (${reading.waterCurr}) must be >= previous reading (${reading.waterPrev}) for room ${reading.roomId}`,
        );
      }

      // Calculate consumption
      const electricConsumption = reading.electricCurr - reading.electricPrev;
      const waterConsumption = reading.waterCurr - reading.waterPrev;

      // Upsert meter reading
      const meterReading = await this.meterReadingModel.findOneAndUpdate(
        {
          tenantId: new Types.ObjectId(tenantId),
          roomId: new Types.ObjectId(reading.roomId),
          billingPeriod,
        },
        {
          tenantId: new Types.ObjectId(tenantId),
          roomId: new Types.ObjectId(reading.roomId),
          billingPeriod,
          electricPrev: reading.electricPrev,
          electricCurr: reading.electricCurr,
          electricConsumption,
          waterPrev: reading.waterPrev,
          waterCurr: reading.waterCurr,
          waterConsumption,
        },
        { upsert: true, new: true },
      );

      results.push(meterReading);
    }

    return results;
  }

  async findAll(
    tenantId: string,
    roomId?: string,
    billingPeriod?: string,
  ): Promise<MeterReadingDocument[]> {
    const query: any = { tenantId: new Types.ObjectId(tenantId) };
    if (roomId) {
      query.roomId = new Types.ObjectId(roomId);
    }
    if (billingPeriod) {
      query.billingPeriod = billingPeriod;
    }
    return this.meterReadingModel.find(query).sort({ billingPeriod: -1 }).exec();
  }
}
