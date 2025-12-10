import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
  ) {}

  async create(
    tenantId: string,
    createRoomDto: CreateRoomDto,
  ): Promise<RoomDocument> {
    const room = new this.roomModel({
      ...createRoomDto,
      tenantId: new Types.ObjectId(tenantId),
      buildingId: new Types.ObjectId(createRoomDto.buildingId),
      services: {
        electricityRate: createRoomDto.services?.electricityRate || 0,
        waterRate: createRoomDto.services?.waterRate || 0,
      },
    });
    return room.save();
  }

  async findAll(tenantId: string, buildingId?: string): Promise<RoomDocument[]> {
    const query: any = { tenantId: new Types.ObjectId(tenantId) };
    if (buildingId) {
      query.buildingId = new Types.ObjectId(buildingId);
    }
    return this.roomModel.find(query).exec();
  }

  async findOne(
    tenantId: string,
    id: string,
  ): Promise<RoomDocument | null> {
    return this.roomModel
      .findOne({
        _id: id,
        tenantId: new Types.ObjectId(tenantId),
      })
      .exec();
  }

  async update(
    tenantId: string,
    id: string,
    updateRoomDto: UpdateRoomDto,
  ): Promise<RoomDocument> {
    const room = await this.findOne(tenantId, id);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (updateRoomDto.services) {
      room.services = {
        ...room.services,
        ...updateRoomDto.services,
      };
    }

    Object.assign(room, {
      ...updateRoomDto,
      services: room.services,
    });
    return room.save();
  }
}
