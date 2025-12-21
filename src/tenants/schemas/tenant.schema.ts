import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TenantDocument = Tenant & Document;

@Schema({ timestamps: true })
export class Tenant {
    // id is automatically created by MongoDB as _id
    @Prop({ type: Types.ObjectId, required: true, ref: 'Account' })
    accountId: Types.ObjectId;

    @Prop({ required: true })
    fullName: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: false })
    documentType?: string; // PASSPORT, ID_CARD, etc.

    @Prop({ required: false })
    documentNumber?: string;

    // createdAt and updatedAt are automatically added by timestamps: true
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

// Indexes
TenantSchema.index({ accountId: 1 });
// Unique phone per accountId
TenantSchema.index({ accountId: 1, phone: 1 }, { unique: true });
TenantSchema.index({ accountId: 1, fullName: 1 });
// Unique documentType + documentNumber per accountId (sparse to allow null)
TenantSchema.index(
    { accountId: 1, documentType: 1, documentNumber: 1 },
    { unique: true, sparse: true }
);

