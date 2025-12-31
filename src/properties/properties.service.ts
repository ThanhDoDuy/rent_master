import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema';
import { Room, RoomDocument } from '../rooms/schemas/room.schema';
import { Contract, ContractDocument, ContractStatus } from '../contracts/schemas/contract.schema';
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
    @InjectModel(Room.name)
    private roomModel: Model<RoomDocument>,
    @InjectModel(Contract.name)
    private contractModel: Model<ContractDocument>,
  ) {}

  async findAll(accountId: string): Promise<{
    properties: any[];
    totalProperties: number;
    totalRooms: number;
    occupancyRate: number;
  }> {
    this.logger.log(`Finding all properties for accountId: ${accountId}`);
    const accountObjectId = new Types.ObjectId(accountId);
    
    // Run initial queries in parallel
    const [properties, totalRooms, totalOccupiedRooms] = await Promise.all([
      this.propertyModel
        .find({ accountId: accountObjectId })
        .sort({ createdAt: -1 })
        .exec(),
      this.roomModel.countDocuments({
        accountId: accountObjectId,
      }).exec(),
      this.contractModel.countDocuments({
        accountId: accountObjectId,
        status: ContractStatus.ACTIVE,
      }).exec(),
    ]);

    // Calculate occupancy rate
    const occupancyRate = totalRooms > 0 ? totalOccupiedRooms / totalRooms : 0;

    // Get property IDs
    const propertyIds = properties.map(p => p._id);

    // Run aggregate queries in parallel
    const [roomCountsByProperty, occupiedRoomCountsByProperty] = await Promise.all([
      this.roomModel.aggregate([
        {
          $match: {
            accountId: accountObjectId,
            propertyId: { $in: propertyIds },
          },
        },
        {
          $group: {
            _id: '$propertyId',
            totalRooms: { $sum: 1 },
          },
        },
      ]).exec(),
      this.contractModel.aggregate([
        {
          $match: {
            accountId: accountObjectId,
            propertyId: { $in: propertyIds },
            status: ContractStatus.ACTIVE,
          },
        },
        {
          $group: {
            _id: '$propertyId',
            occupiedRooms: { $sum: 1 },
          },
        },
      ]).exec(),
    ]);

    // Create maps for quick lookup
    const roomCountMap = new Map(
      roomCountsByProperty.map(item => [item._id.toString(), item.totalRooms])
    );
    const occupiedRoomCountMap = new Map(
      occupiedRoomCountsByProperty.map(item => [item._id.toString(), item.occupiedRooms])
    );

    return {
      properties: properties.map((prop) => {
        const propertyId = prop._id.toString();
        const totalRoomsForProperty = roomCountMap.get(propertyId) || 0;
        const occupiedRoomsForProperty = occupiedRoomCountMap.get(propertyId) || 0;
        const isFull = totalRoomsForProperty > 0 && occupiedRoomsForProperty === totalRoomsForProperty;
        
        return this.toResponse(prop, {
          totalRooms: totalRoomsForProperty,
          occupiedRooms: occupiedRoomsForProperty,
          status: isFull ? 'full' : 'vacant',
        });
      }),
      totalProperties: properties.length,
      totalRooms,
      occupancyRate: Math.round(occupancyRate * 10000) / 100, // Round to 2 decimal places as percentage
    };
  }

  async findOne(id: string, accountId: string): Promise<any> {
    this.logger.log(`Finding property ${id} for accountId: ${accountId}`);
    const accountObjectId = new Types.ObjectId(accountId);
    const propertyObjectId = new Types.ObjectId(id);
    
    const property = await this.propertyModel
      .findOne({
        _id: propertyObjectId,
        accountId: accountObjectId,
      })
      .exec();

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Get room counts for this property
    const totalRooms = await this.roomModel.countDocuments({
      accountId: accountObjectId,
      propertyId: propertyObjectId,
    }).exec();

    // Get occupied room count (rooms with active contracts)
    const occupiedRooms = await this.contractModel.countDocuments({
      accountId: accountObjectId,
      propertyId: propertyObjectId,
      status: ContractStatus.ACTIVE,
    }).exec();

    const isFull = totalRooms > 0 && occupiedRooms === totalRooms;

    return this.toResponse(property, {
      totalRooms,
      occupiedRooms,
      status: isFull ? 'full' : 'vacant',
    });
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

  private toResponse(property: PropertyDocument, roomInfo?: {
    totalRooms: number;
    occupiedRooms: number;
    status: 'full' | 'vacant';
  }): any {
    return {
      id: property._id.toString(),
      name: property.name,
      address: property.address,
      note: property.note,
      totalRooms: roomInfo?.totalRooms || 0,
      occupiedRooms: roomInfo?.occupiedRooms || 0,
      status: roomInfo?.status || 'vacant',
      createdAt: (property as any).createdAt,
    };
  }
}

