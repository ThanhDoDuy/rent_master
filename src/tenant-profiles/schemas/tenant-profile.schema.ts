import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TenantProfileDocument = TenantProfile & Document;

@Schema({ timestamps: true })
export class TenantProfile {
  @Prop({ type: Types.ObjectId, required: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  fullName: string;

  @Prop()
  phone?: string;

  @Prop()
  idNumber?: string; // CMND/CCCD

  @Prop()
  notes?: string;
}

export const TenantProfileSchema = SchemaFactory.createForClass(TenantProfile);

// Indexes
TenantProfileSchema.index({ tenantId: 1 });
