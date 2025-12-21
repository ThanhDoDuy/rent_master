import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { SubmitMeterReadingsDto } from './dto/submit-meter-readings.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AccountId } from '../common/decorators/account-id.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    @Get('contracts/:contractId/invoices')
    async findByContract(
        @Param('contractId') contractId: string,
        @AccountId() accountId: string,
    ) {
        const invoices = await this.invoicesService.findByContract(contractId, accountId);
        return { invoices };
    }

    @Get('invoices/:id')
    async findOne(@Param('id') id: string, @AccountId() accountId: string) {
        return this.invoicesService.findOne(id, accountId);
    }

    @Post('invoices/:id/meter-readings')
    async submitMeterReadings(
        @Param('id') id: string,
        @Body() submitDto: SubmitMeterReadingsDto,
        @AccountId() accountId: string,
    ) {
        return this.invoicesService.submitMeterReadings(id, submitDto, accountId);
    }

    @Post('invoices/:id/issue')
    async issue(@Param('id') id: string, @AccountId() accountId: string) {
        return this.invoicesService.issue(id, accountId);
    }

  @Post('invoices/:id/void')
  async voidInvoice(@Param('id') id: string, @AccountId() accountId: string) {
    return this.invoicesService.voidInvoice(id, accountId);
  }

  // Test endpoint - Auto generate invoices (for testing)
  @Post('invoices/auto-generate')
  async autoGenerate(@AccountId() accountId: string) {
    await this.invoicesService.autoGenerateInvoices(accountId);
    return { message: 'Auto-generation completed' };
  }
}

