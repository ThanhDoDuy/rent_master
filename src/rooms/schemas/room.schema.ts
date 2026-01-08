import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoomDocument = Room & Document;

export enum RoomStatus {
  VACANT = 'VACANT',
  OCCUPIED = 'OCCUPIED',
}

@Schema({ timestamps: true })
export class Room {
  // id is automatically created by MongoDB as _id
  @Prop({ type: Types.ObjectId, required: true, ref: 'Account' })
  accountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Property' })
  propertyId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    enum: RoomStatus,
    default: RoomStatus.VACANT,
    required: true,
  })
  status: RoomStatus;

  @Prop({ type: Object, required: true })
  templateSnapshot: {
    templateId: string;
    name: string;
    baseRent: number;
    currency: string;
    area?: number;
    services?: any[];
  };

  @Prop({ type: Object, required: false })
  meterReadings?: {
    [key: string]: number; // key = service key (e.g., "ELECTRICITY", "WATER"), value = lastReading
  };

  @Prop({ type: Number, required: false })
  deposit?: number; // Tiền đặt cọc

  @Prop({ required: false })
  note?: string;

  @Prop({ type: [Types.ObjectId], ref: 'Tenant', default: [], required: false })
  occupants?: Types.ObjectId[]; // Người trọ chung (không liên quan đến contract)

  // createdAt is automatically added by timestamps: true
}

export const RoomSchema = SchemaFactory.createForClass(Room);

// Indexes
RoomSchema.index({ accountId: 1 });
RoomSchema.index({ propertyId: 1 });
RoomSchema.index({ accountId: 1, propertyId: 1 });
RoomSchema.index({ accountId: 1, propertyId: 1, name: 1 });

