import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument, InvoiceItem } from './schemas/invoice.schema';

export class UpdateInvoiceDto {
  notes?: string;
  items?: InvoiceItem[];
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
  ) {}

  async findAll(
    tenantId: string,
    billingPeriod?: string,
    status?: string,
  ): Promise<InvoiceDocument[]> {
    const query: any = { tenantId: new Types.ObjectId(tenantId) };
    if (billingPeriod) {
      query.billingPeriod = billingPeriod;
    }
    if (status) {
      query.status = status;
    }
    return this.invoiceModel
      .find(query)
      .populate('roomId')
      .populate('contractId')
      .sort({ billingPeriod: -1 })
      .exec();
  }

  async findOne(
    tenantId: string,
    id: string,
  ): Promise<InvoiceDocument | null> {
    return this.invoiceModel
      .findOne({
        _id: id,
        tenantId: new Types.ObjectId(tenantId),
      })
      .populate('roomId')
      .populate('contractId')
      .exec();
  }

  async update(
    tenantId: string,
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<InvoiceDocument> {
    const invoice = await this.findOne(tenantId, id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (updateInvoiceDto.notes !== undefined) {
      invoice.notes = updateInvoiceDto.notes;
    }

    if (updateInvoiceDto.items !== undefined) {
      invoice.items = updateInvoiceDto.items;
      // Recalculate totalAmount
      invoice.totalAmount = updateInvoiceDto.items.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      // Recalculate remaining amount
      invoice.paidAmount = Math.min(invoice.paidAmount, invoice.totalAmount);
    }

    return invoice.save();
  }

  async findByRoomAndPeriod(
    tenantId: string,
    roomId: string,
    billingPeriod: string,
  ): Promise<InvoiceDocument | null> {
    return this.invoiceModel
      .findOne({
        tenantId: new Types.ObjectId(tenantId),
        roomId: new Types.ObjectId(roomId),
        billingPeriod,
      })
      .exec();
  }
}
