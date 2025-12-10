import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Invoice, InvoiceDocument, InvoiceStatus } from '../invoices/schemas/invoice.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
  ) {}

  async create(
    tenantId: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentDocument> {
    // Find invoice
    const invoice = await this.invoiceModel.findOne({
      _id: createPaymentDto.invoiceId,
      tenantId: new Types.ObjectId(tenantId),
    }).exec();

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Validate payment amount
    const newPaidAmount = invoice.paidAmount + createPaymentDto.amount;
    if (newPaidAmount > invoice.totalAmount) {
      throw new BadRequestException(
        `Payment amount exceeds invoice total. Remaining: ${invoice.totalAmount - invoice.paidAmount}`,
      );
    }

    // Create payment document
    const payment = new this.paymentModel({
      ...createPaymentDto,
      tenantId: new Types.ObjectId(tenantId),
      invoiceId: new Types.ObjectId(createPaymentDto.invoiceId),
      paidAt: createPaymentDto.paidAt ? new Date(createPaymentDto.paidAt) : new Date(),
    });

    const savedPayment = await payment.save();

    // Increase invoice.paidAmount
    invoice.paidAmount = newPaidAmount;

    // Update invoice status
    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.status = InvoiceStatus.PAID;
    } else if (invoice.paidAmount > 0) {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    }

    await invoice.save();

    return savedPayment;
  }

  async findAll(
    tenantId: string,
    invoiceId?: string,
  ): Promise<PaymentDocument[]> {
    const query: any = { tenantId: new Types.ObjectId(tenantId) };
    if (invoiceId) {
      query.invoiceId = new Types.ObjectId(invoiceId);
    }
    return this.paymentModel.find(query).sort({ paidAt: -1 }).exec();
  }
}
