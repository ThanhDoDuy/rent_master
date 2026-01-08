import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContractDocument = Contract & Document;

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  TERMINATED = 'TERMINATED',
}

@Schema({ timestamps: true })
export class Contract {
  // id is automatically created by MongoDB as _id
  @Prop({ type: Types.ObjectId, required: true, ref: 'Account' })
  accountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Property', index: true })
  propertyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Room', index: true })
  roomId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ContractStatus,
    default: ContractStatus.DRAFT,
    required: true,
    index: true,
  })
  status: ContractStatus;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ type: Date, required: false })
  terminatedAt?: Date;

  @Prop({ type: String, required: false })
  reason?: string; // Reason for termination

  @Prop({ type: Object, required: false })
  pricingSnapshot?: {
    templateId?: string;
    baseRent: number;
    currency: string;
    services?: any[];
  };

  @Prop({ type: Object, required: false })
  primaryTenant?: {
    tenantId: Types.ObjectId; // Reference to Tenant
    name: string;
    phone: string;
  };

  // createdAt is automatically added by timestamps: true
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

// Indexes
ContractSchema.index({ accountId: 1 });
ContractSchema.index({ roomId: 1, status: 1 });
ContractSchema.index({ accountId: 1, status: 1 });

