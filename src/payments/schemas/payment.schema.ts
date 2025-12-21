import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentMethod {
    CASH = 'CASH',
    BANK_TRANSFER = 'BANK_TRANSFER',
    CARD = 'CARD',
    OTHER = 'OTHER',
}

@Schema({ timestamps: true })
export class Payment {
    // id is automatically created by MongoDB as _id
    @Prop({ type: Types.ObjectId, required: true, ref: 'Account' })
    accountId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, required: true, ref: 'Invoice', index: true })
    invoiceId: Types.ObjectId;

    @Prop({ type: Number, required: true })
    amount: number;

    @Prop({ type: String, required: true })
    currency: string;

    @Prop({ type: Date, required: true })
    paidAt: Date;

    @Prop({
        type: String,
        enum: PaymentMethod,
        required: true,
    })
    method: PaymentMethod;

    @Prop({ type: String, required: false })
    note?: string;

    // createdAt is automatically added by timestamps: true
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indexes
PaymentSchema.index({ accountId: 1 });
PaymentSchema.index({ invoiceId: 1 });
PaymentSchema.index({ accountId: 1, invoiceId: 1 });

