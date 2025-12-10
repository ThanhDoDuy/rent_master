import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MeterReadingsController } from './meter-readings.controller';
import { MeterReadingsService } from './meter-readings.service';
import {
  MeterReading,
  MeterReadingSchema,
} from './schemas/meter-reading.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MeterReading.name, schema: MeterReadingSchema },
    ]),
  ],
  controllers: [MeterReadingsController],
  providers: [MeterReadingsService],
  exports: [MeterReadingsService],
})
export class MeterReadingsModule {}

