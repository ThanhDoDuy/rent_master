import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TenantProfile,
  TenantProfileDocument,
} from './schemas/tenant-profile.schema';
import { CreateTenantProfileDto } from './dto/create-tenant-profile.dto';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';

@Injectable()
export class TenantProfilesService {
  constructor(
    @InjectModel(TenantProfile.name)
    private tenantProfileModel: Model<TenantProfileDocument>,
  ) {}

  async create(
    tenantId: string,
    createTenantProfileDto: CreateTenantProfileDto,
  ): Promise<TenantProfileDocument> {
    const tenantProfile = new this.tenantProfileModel({
      ...createTenantProfileDto,
      tenantId: new Types.ObjectId(tenantId),
    });
    return tenantProfile.save();
  }

  async findAll(tenantId: string): Promise<TenantProfileDocument[]> {
    return this.tenantProfileModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .exec();
  }

  async findOne(
    tenantId: string,
    id: string,
  ): Promise<TenantProfileDocument | null> {
    return this.tenantProfileModel
      .findOne({
        _id: id,
        tenantId: new Types.ObjectId(tenantId),
      })
      .exec();
  }

  async update(
    tenantId: string,
    id: string,
    updateTenantProfileDto: UpdateTenantProfileDto,
  ): Promise<TenantProfileDocument> {
    const tenantProfile = await this.findOne(tenantId, id);
    if (!tenantProfile) {
      throw new NotFoundException('Tenant profile not found');
    }

    Object.assign(tenantProfile, updateTenantProfileDto);
    return tenantProfile.save();
  }
}
