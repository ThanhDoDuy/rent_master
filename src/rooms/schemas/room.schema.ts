import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoomDocument = Room & Document;

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
}

@Schema({ timestamps: true })
export class Room {
  @Prop({ type: Types.ObjectId, required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Building' })
  buildingId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  baseRent: number; // VND

  @Prop({ type: String, enum: RoomStatus, default: RoomStatus.AVAILABLE })
  status: RoomStatus;

  @Prop({
    type: {
      electricityRate: { type: Number, default: 0 },
      waterRate: { type: Number, default: 0 },
    },
    default: { electricityRate: 0, waterRate: 0 },
  })
  services: {
    electricityRate: number; // VND per unit
    waterRate: number; // VND per unit
  };
}

export const RoomSchema = SchemaFactory.createForClass(Room);

// Indexes
RoomSchema.index({ tenantId: 1, buildingId: 1 });
