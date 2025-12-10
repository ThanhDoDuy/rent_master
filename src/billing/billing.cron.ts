import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument, InvoiceStatus } from '../invoices/schemas/invoice.schema';

@Injectable()
export class BillingCronService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
  ) {}

  // Run daily at 2 AM to check for overdue invoices
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkOverdueInvoices() {
    // TODO: Implement overdue detection logic
    // - Find invoices with status SENT or PARTIALLY_PAID
    // - Check if dueDate < today
    // - Update status to OVERDUE
    console.log('[Cron] Checking overdue invoices...');
  }
}

