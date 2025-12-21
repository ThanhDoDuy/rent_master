import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  VOID = 'VOID',
}

export enum GeneratedBy {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

@Schema({ timestamps: true })
export class Invoice {
  // id is automatically created by MongoDB as _id
  @Prop({ type: Types.ObjectId, required: true, ref: 'Account' })
  accountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Contract' })
  contractId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  periodStart: Date;

  @Prop({ type: Date, required: true })
  periodEnd: Date;

  @Prop({
    type: String,
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
    required: true,
    index: true,
  })
  status: InvoiceStatus;

  @Prop({ type: Number, required: true })
  totalAmount: number;

  @Prop({ type: String, required: true })
  currency: string;

  @Prop({
    type: String,
    enum: GeneratedBy,
    default: GeneratedBy.AUTO,
    required: true,
  })
  generatedBy: GeneratedBy;

  @Prop({ type: Number, required: true })
  baseRent: number;

  @Prop({ type: Array, required: true })
  services: Array<{
    key: string;
    name: string;
    type: 'FIXED' | 'METERED';
    unit?: string;
    price: number;
    lastReading?: number;
    endReading?: number;
    usage?: number;
    amount?: number;
  }>;

  @Prop({ type: Date, required: false })
  issuedAt?: Date;

  // createdAt is automatically added by timestamps: true
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// Indexes
InvoiceSchema.index({ accountId: 1 });
InvoiceSchema.index({ contractId: 1 });
InvoiceSchema.index({ contractId: 1, periodStart: 1, periodEnd: 1 }, { unique: true });
InvoiceSchema.index({ accountId: 1, status: 1 });

