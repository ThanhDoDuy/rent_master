import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoomTemplateDocument = RoomTemplate & Document;

@Schema({ timestamps: true })
export class RoomTemplate {
  // id is automatically created by MongoDB as _id
  @Prop({ type: Types.ObjectId, required: true, ref: 'Account' })
  accountId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, required: true })
  baseRent: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ type: Object, required: false })
  services?: any; // JSONB equivalent - stored as object in MongoDB

  // createdAt is automatically added by timestamps: true
}

export const RoomTemplateSchema = SchemaFactory.createForClass(RoomTemplate);

// Indexes
RoomTemplateSchema.index({ accountId: 1 });
RoomTemplateSchema.index({ accountId: 1, name: 1 });

