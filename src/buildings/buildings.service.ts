import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Building, BuildingDocument } from './schemas/building.schema';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectModel(Building.name) private buildingModel: Model<BuildingDocument>,
  ) {}

  async create(
    tenantId: string,
    createBuildingDto: CreateBuildingDto,
  ): Promise<BuildingDocument> {
    const building = new this.buildingModel({
      ...createBuildingDto,
      tenantId: new Types.ObjectId(tenantId),
    });
    return building.save();
  }

  async findAll(tenantId: string): Promise<BuildingDocument[]> {
    return this.buildingModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .exec();
  }

  async findOne(
    tenantId: string,
    id: string,
  ): Promise<BuildingDocument | null> {
    return this.buildingModel
      .findOne({
        _id: id,
        tenantId: new Types.ObjectId(tenantId),
      })
      .exec();
  }

  async update(
    tenantId: string,
    id: string,
    updateBuildingDto: UpdateBuildingDto,
  ): Promise<BuildingDocument> {
    const building = await this.findOne(tenantId, id);
    if (!building) {
      throw new NotFoundException('Building not found');
    }

    Object.assign(building, updateBuildingDto);
    return building.save();
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const result = await this.buildingModel
      .deleteOne({
        _id: id,
        tenantId: new Types.ObjectId(tenantId),
      })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Building not found');
    }
  }
}
