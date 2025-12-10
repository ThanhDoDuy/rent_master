import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BuildingDocument = Building & Document;

@Schema({ timestamps: true })
export class Building {
  @Prop({ type: Types.ObjectId, required: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  address?: string;

  @Prop()
  description?: string;
}

export const BuildingSchema = SchemaFactory.createForClass(Building);

// Indexes
BuildingSchema.index({ tenantId: 1 });
