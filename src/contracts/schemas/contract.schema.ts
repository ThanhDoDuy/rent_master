import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContractDocument = Contract & Document;

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
}

@Schema({ timestamps: true })
export class Contract {
  @Prop({ type: Types.ObjectId, required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Room' })
  roomId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'TenantProfile' })
  tenantProfileId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop({ default: 0 })
  depositAmount: number; // VND

  @Prop({
    type: String,
    enum: ContractStatus,
    default: ContractStatus.ACTIVE,
  })
  status: ContractStatus;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

// Indexes
ContractSchema.index({ tenantId: 1 });
ContractSchema.index({ roomId: 1 });
