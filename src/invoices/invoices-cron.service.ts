import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InvoicesService } from './invoices.service';

@Injectable()
export class InvoicesCronService {
  private readonly logger = new Logger(InvoicesCronService.name);

  constructor(private readonly invoicesService: InvoicesService) {}

  // Run every day at 1:00 AM
  @Cron('0 1 * * *', {
    name: 'auto-generate-invoices',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleAutoGenerateInvoices() {
    this.logger.log('Starting auto-generate invoices cron job');
    
    try {
      // Generate invoices for all accounts (no accountId filter)
      await this.invoicesService.autoGenerateInvoices();
      this.logger.log('Auto-generate invoices cron job completed successfully');
    } catch (error) {
      this.logger.error('Auto-generate invoices cron job failed', {
        error: {
          message: error.message,
          stack: error.stack,
        },
      });
    }
  }
}

