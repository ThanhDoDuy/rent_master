import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument, InvoiceStatus, GeneratedBy } from './schemas/invoice.schema';
import { Contract, ContractDocument, ContractStatus } from '../contracts/schemas/contract.schema';
import { SubmitMeterReadingsDto } from './dto/submit-meter-readings.dto';
import { AppBadRequestException } from '../common/exceptions/app.exception';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectModel(Invoice.name)
    private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Contract.name)
    private contractModel: Model<ContractDocument>,
  ) {}

  async findByContract(
    contractId: string,
    accountId: string,
  ): Promise<any[]> {
    this.logger.log(`Finding invoices for contract ${contractId}`);

    // Verify contract exists and belongs to account
    const contract = await this.contractModel
      .findOne({
        _id: new Types.ObjectId(contractId),
        accountId: new Types.ObjectId(accountId),
      })
      .exec();

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const invoices = await this.invoiceModel
      .find({
        contractId: new Types.ObjectId(contractId),
        accountId: new Types.ObjectId(accountId),
      })
      .sort({ periodStart: -1 })
      .exec();

    return invoices.map((inv) => ({
      id: inv._id.toString(),
      periodStart: inv.periodStart,
      periodEnd: inv.periodEnd,
      status: inv.status,
      generatedBy: inv.generatedBy,
    }));
  }

  async findOne(invoiceId: string, accountId: string): Promise<any> {
    this.logger.log(`Finding invoice ${invoiceId}`);

    const invoice = await this.invoiceModel
      .findOne({
        _id: new Types.ObjectId(invoiceId),
        accountId: new Types.ObjectId(accountId),
      })
      .exec();

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return {
      id: invoice._id.toString(),
      contractId: invoice.contractId.toString(),
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      status: invoice.status,
      currency: invoice.currency,
      baseRent: invoice.baseRent,
      services: invoice.services,
      totalAmount: invoice.totalAmount,
      issuedAt: invoice.issuedAt || null,
    };
  }

  async submitMeterReadings(
    invoiceId: string,
    submitDto: SubmitMeterReadingsDto,
    accountId: string,
  ): Promise<any> {
    this.logger.log(`Submitting meter readings for invoice ${invoiceId}`);

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

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new AppBadRequestException(ErrorCode.INVOICE_NOT_DRAFT);
    }

    // Get contract to update lastReading
    const contract = await this.contractModel
      .findById(invoice.contractId)
      .exec();

    if (!contract || !contract.pricingSnapshot) {
      throw new NotFoundException('Contract or pricing snapshot not found');
    }

    // Update services with meter readings
    const updatedServices = invoice.services.map((service) => {
      if (service.type !== 'METERED') {
        return service;
      }

      const reading = submitDto.readings.find((r) => r.key === service.key);
      if (!reading) {
        return service;
      }

      // Validate endReading >= lastReading
      const lastReading = service.lastReading || 0;
      if (reading.endReading < lastReading) {
        throw new AppBadRequestException(ErrorCode.INVOICE_INVALID_METER_READING);
      }

      const usage = reading.endReading - lastReading;
      const amount = usage * service.price;

      // Update contract's lastReading for this service
      if (contract.pricingSnapshot && contract.pricingSnapshot.services) {
        const contractService = contract.pricingSnapshot.services.find(
          (s: any) => (s.key || s.name) === service.key,
        );
        if (contractService) {
          contractService.lastReading = reading.endReading;
        }
      }

      return {
        ...service,
        endReading: reading.endReading,
        usage,
        amount,
      };
    });

    // Recalculate totalAmount
    const fixedAmount = updatedServices
      .filter((s) => s.type === 'FIXED' && s.amount)
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    const meteredAmount = updatedServices
      .filter((s) => s.type === 'METERED' && s.amount)
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    const totalAmount = invoice.baseRent + fixedAmount + meteredAmount;

    // Update invoice
    await this.invoiceModel.updateOne(
      { _id: new Types.ObjectId(invoiceId) },
      {
        $set: {
          services: updatedServices,
          totalAmount,
        },
      },
    );

    // Update contract's pricingSnapshot
    await this.contractModel.updateOne(
      { _id: contract._id },
      { $set: { pricingSnapshot: contract.pricingSnapshot } },
    );

    return {
      invoiceId: invoice._id.toString(),
      status: invoice.status,
      services: updatedServices,
      totalAmount,
    };
  }

  async issue(invoiceId: string, accountId: string): Promise<any> {
    this.logger.log(`Issuing invoice ${invoiceId}`);

    const invoice = await this.invoiceModel
      .findOne({
        _id: new Types.ObjectId(invoiceId),
        accountId: new Types.ObjectId(accountId),
      })
      .exec();

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new AppBadRequestException(ErrorCode.INVOICE_NOT_DRAFT);
    }

    // Check all metered services have endReading
    const meteredServices = invoice.services.filter((s) => s.type === 'METERED');
    const missingReadings = meteredServices.filter(
      (s) => !s.endReading || s.endReading === null,
    );

    if (missingReadings.length > 0) {
      throw new AppBadRequestException(
        ErrorCode.INVOICE_METER_READING_REQUIRED,
        `Missing meter readings for: ${missingReadings.map((s) => s.key).join(', ')}`,
      );
    }

    // Update invoice to ISSUED
    await this.invoiceModel.updateOne(
      { _id: new Types.ObjectId(invoiceId) },
      {
        $set: {
          status: InvoiceStatus.ISSUED,
          issuedAt: new Date(),
        },
      },
    );

    return {
      invoiceId: invoice._id.toString(),
      status: InvoiceStatus.ISSUED,
    };
  }

  async voidInvoice(invoiceId: string, accountId: string): Promise<any> {
    this.logger.log(`Voiding invoice ${invoiceId}`);

    const invoice = await this.invoiceModel
      .findOne({
        _id: new Types.ObjectId(invoiceId),
        accountId: new Types.ObjectId(accountId),
      })
      .exec();

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.ISSUED || invoice.status === InvoiceStatus.PAID) {
      // Can only void DRAFT or PARTIALLY_PAID
      throw new AppBadRequestException(ErrorCode.INVOICE_CANNOT_VOID);
    }

    await this.invoiceModel.updateOne(
      { _id: new Types.ObjectId(invoiceId) },
      { $set: { status: InvoiceStatus.VOID } },
    );

    return {
      invoiceId: invoice._id.toString(),
      status: InvoiceStatus.VOID,
    };
  }

  // Auto-generate invoice (for cron job)
  async autoGenerateInvoices(accountId?: string): Promise<void> {
    this.logger.log('Auto-generating invoices for active contracts');

    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Find active contracts
    const query: any = {
      status: ContractStatus.ACTIVE,
    };
    if (accountId) {
      query.accountId = new Types.ObjectId(accountId);
    }

    const contracts = await this.contractModel.find(query).exec();

    for (const contract of contracts) {
      // Check if invoice already exists for this period
      const existingInvoice = await this.invoiceModel
        .findOne({
          contractId: contract._id,
          periodStart: currentMonth,
          periodEnd: nextMonth,
        })
        .exec();

      if (existingInvoice) {
        continue;
      }

      // Check if contract has pricingSnapshot
      if (!contract.pricingSnapshot) {
        this.logger.warn(`Contract ${contract._id} has no pricing snapshot`);
        continue;
      }

      // Create invoice DRAFT
      const services = contract.pricingSnapshot.services?.map((s: any) => {
        const key = s.key || s.name;
        return {
          key,
          name: s.name,
          type: s.type,
          unit: s.unit,
          price: s.type === 'METERED' ? s.unitPrice : s.amount,
          lastReading: s.lastReading || null,
          endReading: null,
          usage: null,
          amount: s.type === 'FIXED' ? s.amount : null,
        };
      }) || [];

      const fixedAmount = services
        .filter((s) => s.type === 'FIXED' && s.amount)
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const totalAmount = contract.pricingSnapshot.baseRent + fixedAmount;

      await this.invoiceModel.create({
        accountId: contract.accountId,
        contractId: contract._id,
        periodStart: currentMonth,
        periodEnd: nextMonth,
        status: InvoiceStatus.DRAFT,
        totalAmount,
        currency: contract.pricingSnapshot.currency,
        generatedBy: GeneratedBy.AUTO,
        baseRent: contract.pricingSnapshot.baseRent,
        services,
      });
    }
  }
}

