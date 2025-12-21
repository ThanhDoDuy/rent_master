import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContractTenantDocument = ContractTenant & Document;

export enum TenantRole {
  PRIMARY = 'PRIMARY',
  OCCUPANT = 'OCCUPANT',
}

@Schema({ timestamps: true })
export class ContractTenant {
  // id is automatically created by MongoDB as _id
  @Prop({ type: Types.ObjectId, required: true, ref: 'Contract' })
  contractId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Tenant' })
  tenantId: Types.ObjectId;

  @Prop({
    type: String,
    enum: TenantRole,
    required: true,
  })
  role: TenantRole;

  // createdAt is automatically added by timestamps: true
}

export const ContractTenantSchema = SchemaFactory.createForClass(ContractTenant);

// Indexes
ContractTenantSchema.index({ contractId: 1 });
ContractTenantSchema.index({ tenantId: 1 });
ContractTenantSchema.index({ contractId: 1, tenantId: 1 }, { unique: true });
ContractTenantSchema.index({ contractId: 1, role: 1 });

