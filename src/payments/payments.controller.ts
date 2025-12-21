import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AccountId } from '../common/decorators/account-id.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Get('invoices/:invoiceId/payments')
    async findByInvoice(
        @Param('invoiceId') invoiceId: string,
        @AccountId() accountId: string,
    ) {
        const payments = await this.paymentsService.findByInvoice(invoiceId, accountId);
        return { payments };
    }

    @Post('invoices/:invoiceId/payments')
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Param('invoiceId') invoiceId: string,
        @Body() createPaymentDto: CreatePaymentDto,
        @AccountId() accountId: string,
    ) {
        return this.paymentsService.create(invoiceId, createPaymentDto, accountId);
    }
}

