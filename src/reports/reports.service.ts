import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument, InvoiceStatus } from '../invoices/schemas/invoice.schema';
import { Room, RoomDocument, RoomStatus } from '../rooms/schemas/room.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async getMonthlyRevenue(
    tenantId: string,
    billingPeriod: string,
  ): Promise<{
    billingPeriod: string;
    totalRevenue: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    invoiceCount: number;
  }> {
    const invoices = await this.invoiceModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        billingPeriod,
      })
      .exec();

    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + inv.totalAmount,
      0,
    );
    const paidAmount = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const pendingAmount = invoices.reduce(
      (sum, inv) =>
        sum +
        (inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.DRAFT
          ? inv.totalAmount - inv.paidAmount
          : 0),
      0,
    );
    const overdueAmount = invoices.reduce(
      (sum, inv) =>
        sum + (inv.status === InvoiceStatus.OVERDUE ? inv.totalAmount - inv.paidAmount : 0),
      0,
    );

    return {
      billingPeriod,
      totalRevenue,
      paidAmount,
      pendingAmount,
      overdueAmount,
      invoiceCount: invoices.length,
    };
  }

  async getDebts(tenantId: string): Promise<{
    totalDebt: number;
    overdueDebt: number;
    invoices: any[];
  }> {
    const invoices = await this.invoiceModel
      .aggregate([
        {
          $match: {
            tenantId: new Types.ObjectId(tenantId),
            status: {
              $in: [
                InvoiceStatus.SENT,
                InvoiceStatus.PARTIALLY_PAID,
                InvoiceStatus.OVERDUE,
              ],
            },
          },
        },
        {
          $addFields: {
            remainingAmount: { $subtract: ['$totalAmount', '$paidAmount'] },
          },
        },
        {
          $match: {
            remainingAmount: { $gt: 0 },
          },
        },
        {
          $lookup: {
            from: 'rooms',
            localField: 'roomId',
            foreignField: '_id',
            as: 'room',
          },
        },
        {
          $unwind: { path: '$room', preserveNullAndEmptyArrays: true },
        },
        {
          $sort: { billingPeriod: -1 },
        },
      ])
      .exec();

    const totalDebt = invoices.reduce(
      (sum, inv) => sum + (inv.totalAmount - inv.paidAmount),
      0,
    );
    const overdueDebt = invoices
      .filter((inv) => inv.status === InvoiceStatus.OVERDUE)
      .reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);

    return {
      totalDebt,
      overdueDebt,
      invoices: invoices.map((inv) => ({
        id: inv._id,
        billingPeriod: inv.billingPeriod,
        roomName: inv.room?.name || 'N/A',
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        remainingAmount: inv.totalAmount - inv.paidAmount,
        status: inv.status,
        dueDate: inv.dueDate,
      })),
    };
  }

  async getOccupancy(tenantId: string): Promise<{
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    occupancyRate: number;
  }> {
    const rooms = await this.roomModel
      .aggregate([
        {
          $match: {
            tenantId: new Types.ObjectId(tenantId),
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const totalRooms = rooms.reduce((sum, r) => sum + r.count, 0);
    const occupiedRooms =
      rooms.find((r) => r._id === RoomStatus.OCCUPIED)?.count || 0;
    const availableRooms =
      rooms.find((r) => r._id === RoomStatus.AVAILABLE)?.count || 0;

    const occupancyRate =
      totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    return {
      totalRooms,
      occupiedRooms,
      availableRooms,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
    };
  }
}
