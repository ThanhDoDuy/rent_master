import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MeterReadingDocument = MeterReading & Document;

@Schema({ timestamps: true })
export class MeterReading {
  @Prop({ type: Types.ObjectId, required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Room' })
  roomId: Types.ObjectId;

  @Prop({ required: true })
  billingPeriod: string; // Format: YYYY-MM (e.g., "2025-12")

  @Prop({ required: true })
  electricPrev: number;

  @Prop({ required: true })
  electricCurr: number;

  @Prop({ required: true })
  electricConsumption: number; // electricCurr - electricPrev

  @Prop({ required: true })
  waterPrev: number;

  @Prop({ required: true })
  waterCurr: number;

  @Prop({ required: true })
  waterConsumption: number; // waterCurr - waterPrev
}

export const MeterReadingSchema = SchemaFactory.createForClass(MeterReading);

// Indexes
MeterReadingSchema.index({ tenantId: 1, roomId: 1, billingPeriod: 1 }, { unique: true });
