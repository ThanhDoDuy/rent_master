import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contract, ContractDocument, ContractStatus } from './schemas/contract.schema';
import { CreateContractDto } from './dto/create-contract.dto';
import { Room, RoomDocument, RoomStatus } from '../rooms/schemas/room.schema';

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
  ) {}

  async create(
    tenantId: string,
    createContractDto: CreateContractDto,
  ): Promise<ContractDocument> {
    // Check if room exists and belongs to tenant
    const room = await this.roomModel.findOne({
      _id: createContractDto.roomId,
      tenantId: new Types.ObjectId(tenantId),
    }).exec();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.status === RoomStatus.OCCUPIED) {
      throw new BadRequestException('Room is already occupied');
    }

    // Create contract (Check-in)
    const contract = new this.contractModel({
      ...createContractDto,
      tenantId: new Types.ObjectId(tenantId),
      roomId: new Types.ObjectId(createContractDto.roomId),
      tenantProfileId: new Types.ObjectId(createContractDto.tenantProfileId),
      startDate: new Date(createContractDto.startDate),
      endDate: createContractDto.endDate ? new Date(createContractDto.endDate) : undefined,
      status: ContractStatus.ACTIVE,
    });

    const savedContract = await contract.save();

    // Update room status to OCCUPIED
    room.status = RoomStatus.OCCUPIED;
    await room.save();

    return savedContract;
  }

  async findAll(tenantId: string): Promise<ContractDocument[]> {
    return this.contractModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .populate('roomId')
      .populate('tenantProfileId')
      .exec();
  }

  async findOne(
    tenantId: string,
    id: string,
  ): Promise<ContractDocument | null> {
    return this.contractModel
      .findOne({
        _id: id,
        tenantId: new Types.ObjectId(tenantId),
      })
      .populate('roomId')
      .populate('tenantProfileId')
      .exec();
  }

  async endContract(
    tenantId: string,
    contractId: string,
  ): Promise<ContractDocument> {
    const contract = await this.findOne(tenantId, contractId);
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.status === ContractStatus.ENDED) {
      throw new BadRequestException('Contract is already ended');
    }

    // Update contract status to ENDED (Check-out)
    contract.status = ContractStatus.ENDED;
    contract.endDate = new Date();
    await contract.save();

    // Update room status to AVAILABLE
    const room = await this.roomModel.findById(contract.roomId).exec();
    if (room) {
      room.status = RoomStatus.AVAILABLE;
      await room.save();
    }

    return contract;
  }
}
