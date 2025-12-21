import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { AppBadRequestException } from '../common/exceptions/app.exception';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    @InjectModel(Property.name)
    private propertyModel: Model<PropertyDocument>,
  ) {}

  async findAll(accountId: string): Promise<Property[]> {
    this.logger.log(`Finding all properties for accountId: ${accountId}`);
    const properties = await this.propertyModel
      .find({ accountId: new Types.ObjectId(accountId) })
      .sort({ createdAt: -1 })
      .exec();

    return properties.map((prop) => this.toResponse(prop));
  }

  async findOne(id: string, accountId: string): Promise<Property> {
    this.logger.log(`Finding property ${id} for accountId: ${accountId}`);
    const property = await this.propertyModel
      .findOne({
        _id: new Types.ObjectId(id),
        accountId: new Types.ObjectId(accountId),
      })
      .exec();

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.toResponse(property);
  }

  async create(
    createPropertyDto: CreatePropertyDto,
    accountId: string,
  ): Promise<Property> {
    this.logger.log(`Creating property for accountId: ${accountId}`);
    const property = await this.propertyModel.create({
      ...createPropertyDto,
      accountId: new Types.ObjectId(accountId),
    });

    return this.toResponse(property);
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
    accountId: string,
  ): Promise<Property> {
    this.logger.log(`Updating property ${id} for accountId: ${accountId}`);
    const property = await this.propertyModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          accountId: new Types.ObjectId(accountId),
        },
        { $set: updatePropertyDto },
        { new: true },
      )
      .exec();

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.toResponse(property);
  }

  async remove(id: string, accountId: string): Promise<{ id: string }> {
    this.logger.log(`Deleting property ${id} for accountId: ${accountId}`);

    // Check if property exists and belongs to account
    const property = await this.propertyModel
      .findOne({
        _id: new Types.ObjectId(id),
        accountId: new Types.ObjectId(accountId),
      })
      .exec();

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Check if property has rooms or contracts
    // Note: This will work once Room and Contract schemas are created
    // For now, we'll check if collections exist and have references
    const db = this.propertyModel.db;
    
    // Check for rooms
    const roomsCollection = db.collection('rooms');
    const roomCount = await roomsCollection.countDocuments({
      propertyId: new Types.ObjectId(id),
      accountId: new Types.ObjectId(accountId),
    });

    if (roomCount > 0) {
      throw new AppBadRequestException(ErrorCode.PROPERTY_IN_USE);
    }

    // Check for contracts
    const contractsCollection = db.collection('contracts');
    const contractCount = await contractsCollection.countDocuments({
      propertyId: new Types.ObjectId(id),
      accountId: new Types.ObjectId(accountId),
    });

    if (contractCount > 0) {
      throw new AppBadRequestException(ErrorCode.PROPERTY_IN_USE);
    }

    // Safe to delete
    await this.propertyModel.deleteOne({
      _id: new Types.ObjectId(id),
      accountId: new Types.ObjectId(accountId),
    });

    return { id };
  }

  private toResponse(property: PropertyDocument): any {
    return {
      id: property._id.toString(),
      name: property.name,
      address: property.address,
      note: property.note,
      createdAt: (property as any).createdAt,
    };
  }
}

