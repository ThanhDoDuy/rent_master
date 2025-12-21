import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument, PaymentMethod } from './schemas/payment.schema';
import { Invoice, InvoiceDocument, InvoiceStatus } from '../invoices/schemas/invoice.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AppBadRequestException } from '../common/exceptions/app.exception';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        @InjectModel(Payment.name)
        private paymentModel: Model<PaymentDocument>,
        @InjectModel(Invoice.name)
        private invoiceModel: Model<InvoiceDocument>,
    ) { }

    async findByInvoice(
        invoiceId: string,
        accountId: string,
    ): Promise<any[]> {
        this.logger.log(`Finding payments for invoice ${invoiceId}`);

        // Verify invoice exists and belongs to account
        const invoice = await this.invoiceModel
            .findOne({
                _id: new Types.ObjectId(invoiceId),
                accountId: new Types.ObjectId(accountId),
            })
            .exec();

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        const payments = await this.paymentModel
            .find({
                invoiceId: new Types.ObjectId(invoiceId),
                accountId: new Types.ObjectId(accountId),
            })
            .sort({ paidAt: -1 })
            .exec();

        return payments.map((payment) => ({
            id: payment._id.toString(),
            amount: payment.amount,
            currency: payment.currency,
            paidAt: payment.paidAt,
            method: payment.method,
            note: payment.note || null,
        }));
    }

    async create(
        invoiceId: string,
        createPaymentDto: CreatePaymentDto,
        accountId: string,
    ): Promise<any> {
        this.logger.log(`Creating payment for invoice ${invoiceId}`);

        // Get invoice
        const invoice = await this.invoiceModel
            .findOne({
                _id: new Types.ObjectId(invoiceId),
                accountId: new Types.ObjectId(accountId),
            })
            .exec();

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        // Validate invoice status - only ISSUED or PARTIALLY_PAID can receive payments
        if (
            invoice.status === InvoiceStatus.DRAFT ||
            invoice.status === InvoiceStatus.VOID ||
            invoice.status === InvoiceStatus.PAID
        ) {
            throw new AppBadRequestException(ErrorCode.INVOICE_NOT_PAYABLE);
        }

        // Calculate current total paid BEFORE creating new payment
        const currentTotalPaidResult = await this.paymentModel.aggregate([
            {
                $match: {
                    invoiceId: new Types.ObjectId(invoiceId),
                    accountId: new Types.ObjectId(accountId),
                },
            },
            {
                $group: {
                    _id: null,
                    totalPaid: { $sum: '$amount' },
                },
            },
        ]);

        const currentTotalPaid = currentTotalPaidResult.length > 0 ? currentTotalPaidResult[0].totalPaid : 0;
        const currentRemaining = invoice.totalAmount - currentTotalPaid;

        // Block payment if remaining = 0 (invoice already fully paid)
        if (currentRemaining <= 0) {
            throw new AppBadRequestException(ErrorCode.INVOICE_ALREADY_PAID);
        }

        // Block payment if amount > remaining
        if (createPaymentDto.amount > currentRemaining) {
            throw new AppBadRequestException(ErrorCode.PAYMENT_AMOUNT_EXCEEDS_REMAINING);
        }

        // Amount validation is handled by DTO (@Min(0.01))

        // Create payment
        const payment = await this.paymentModel.create({
            accountId: new Types.ObjectId(accountId),
            invoiceId: new Types.ObjectId(invoiceId),
            amount: createPaymentDto.amount,
            currency: invoice.currency,
            paidAt: new Date(createPaymentDto.paidAt),
            method: createPaymentDto.method as PaymentMethod,
            note: createPaymentDto.note,
        });

        // Calculate total paid for this invoice
        const totalPaidResult = await this.paymentModel.aggregate([
            {
                $match: {
                    invoiceId: new Types.ObjectId(invoiceId),
                    accountId: new Types.ObjectId(accountId),
                },
            },
            {
                $group: {
                    _id: null,
                    totalPaid: { $sum: '$amount' },
                },
            },
        ]);

        const totalPaid = totalPaidResult.length > 0 ? totalPaidResult[0].totalPaid : 0;
        const remaining = invoice.totalAmount - totalPaid;

        // Update invoice status based on totalPaid
        let newStatus: InvoiceStatus;
        if (totalPaid >= invoice.totalAmount) {
            newStatus = InvoiceStatus.PAID;
        } else if (totalPaid > 0) {
            newStatus = InvoiceStatus.PARTIALLY_PAID;
        } else {
            newStatus = InvoiceStatus.ISSUED;
        }

        // Update invoice status
        await this.invoiceModel.updateOne(
            { _id: new Types.ObjectId(invoiceId) },
            { $set: { status: newStatus } },
        );

        return {
            paymentId: payment._id.toString(),
            invoiceStatus: newStatus,
            totalPaid,
            remaining: Math.max(0, remaining),
        };
    }
}

