import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
}

export interface InvoiceItem {
  type: 'RENT' | 'ELECTRICITY' | 'WATER' | 'OTHER';
  description: string;
  quantity?: number;
  unitPrice: number;
  amount: number;
}

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ type: Types.ObjectId, required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Room' })
  roomId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Contract' })
  contractId?: Types.ObjectId;

  @Prop({ required: true })
  billingPeriod: string; // Format: YYYY-MM

  @Prop({ required: true })
  totalAmount: number; // VND

  @Prop({ default: 0 })
  paidAmount: number; // VND

  @Prop({
    type: String,
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Prop({
    type: [
      {
        type: { type: String, enum: ['RENT', 'ELECTRICITY', 'WATER', 'OTHER'] },
        description: String,
        quantity: Number,
        unitPrice: Number,
        amount: Number,
      },
    ],
    default: [],
  })
  items: InvoiceItem[];

  @Prop()
  notes?: string;

  @Prop()
  issueDate?: Date;

  @Prop()
  dueDate?: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// Indexes
InvoiceSchema.index({ tenantId: 1, billingPeriod: 1 });
InvoiceSchema.index({ tenantId: 1, status: 1 });
InvoiceSchema.index({ tenantId: 1, roomId: 1, billingPeriod: 1 }, { unique: true });
