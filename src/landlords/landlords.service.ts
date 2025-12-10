import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from '../auth/schemas/tenant.schema';

@Injectable()
export class LandlordsService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  async findById(tenantId: string): Promise<TenantDocument | null> {
    return this.tenantModel.findById(tenantId).exec();
  }

  async findByEmail(email: string): Promise<TenantDocument | null> {
    return this.tenantModel.findOne({ email }).exec();
  }
}

