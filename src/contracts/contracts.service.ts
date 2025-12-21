import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contract, ContractDocument, ContractStatus } from './schemas/contract.schema';
import { ContractTenant, ContractTenantDocument, TenantRole } from './schemas/contract-tenant.schema';
import { Room, RoomDocument, RoomStatus } from '../rooms/schemas/room.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { CreateContractDto } from './dto/create-contract.dto';
import { AddTenantDto } from './dto/add-tenant.dto';
import { TerminateContractDto } from './dto/terminate-contract.dto';
import { ActivateContractDto } from './dto/activate-contract.dto';
import { AppBadRequestException } from '../common/exceptions/app.exception';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    @InjectModel(Contract.name)
    private contractModel: Model<ContractDocument>,
    @InjectModel(ContractTenant.name)
    private contractTenantModel: Model<ContractTenantDocument>,
    @InjectModel(Room.name)
    private roomModel: Model<RoomDocument>,
    @InjectModel(Tenant.name)
    private tenantModel: Model<TenantDocument>,
  ) {}

  async create(
    createContractDto: CreateContractDto,
    accountId: string,
  ): Promise<any> {
    this.logger.log(`Creating contract for room ${createContractDto.roomId}`);

    // Check room exists and belongs to account
    const room = await this.roomModel
      .findOne({
        _id: new Types.ObjectId(createContractDto.roomId),
        accountId: new Types.ObjectId(accountId),
      })
      .exec();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check no active contract for this room
    const activeContract = await this.contractModel
      .findOne({
        roomId: new Types.ObjectId(createContractDto.roomId),
        accountId: new Types.ObjectId(accountId),
        status: ContractStatus.ACTIVE,
      })
      .exec();

    if (activeContract) {
      throw new AppBadRequestException(ErrorCode.CONTRACT_ROOM_ALREADY_ACTIVE);
    }

    // Validate dates
    const startDate = new Date(createContractDto.startDate);
    const endDate = new Date(createContractDto.endDate);

    if (startDate >= endDate) {
      throw new AppBadRequestException(ErrorCode.CONTRACT_INVALID_DATES);
    }

    // Create contract with DRAFT status
    const contract = await this.contractModel.create({
      accountId: new Types.ObjectId(accountId),
      propertyId: room.propertyId,
      roomId: new Types.ObjectId(createContractDto.roomId),
      status: ContractStatus.DRAFT,
      startDate,
      endDate,
    });

    return {
      id: contract._id.toString(),
      status: contract.status,
    };
  }

  async addTenant(
    contractId: string,
    addTenantDto: AddTenantDto,
    accountId: string,
  ): Promise<{ status: string }> {
    this.logger.log(`Adding tenant ${addTenantDto.tenantId} to contract ${contractId}`);

    // Check contract exists and belongs to account
    const contract = await this.contractModel
      .findOne({
        _id: new Types.ObjectId(contractId),
        accountId: new Types.ObjectId(accountId),
      })
      .exec();

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Check tenant exists and belongs to account
    const tenant = await this.tenantModel
      .findOne({
        _id: new Types.ObjectId(addTenantDto.tenantId),
        accountId: new Types.ObjectId(accountId),
      })
      .exec();

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if tenant already in contract
    const existingLink = await this.contractTenantModel
      .findOne({
        contractId: new Types.ObjectId(contractId),
        tenantId: new Types.ObjectId(addTenantDto.tenantId),
      })
      .exec();

    if (existingLink) {
      throw new AppBadRequestException(ErrorCode.CONTRACT_TENANT_ALREADY_LINKED);
    }

    // If PRIMARY, check no other PRIMARY exists
    if (addTenantDto.role === TenantRole.PRIMARY) {
      const existingPrimary = await this.contractTenantModel
        .findOne({
          contractId: new Types.ObjectId(contractId),
          role: TenantRole.PRIMARY,
        })
        .exec();

      if (existingPrimary) {
        throw new AppBadRequestException(ErrorCode.CONTRACT_PRIMARY_EXISTS);
      }
    }

    // Create contract-tenant link
    await this.contractTenantModel.create({
      contractId: new Types.ObjectId(contractId),
      tenantId: new Types.ObjectId(addTenantDto.tenantId),
      role: addTenantDto.role as TenantRole,
    });

    return { status: 'LINKED' };
  }

  async removeTenant(
    contractId: string,
    tenantId: string,
    accountId: string,
  ): Promise<{ status: string }> {
    this.logger.log(`Removing tenant ${tenantId} from contract ${contractId}`);

    // Check contract exists and belongs to account
    const contract = await this.contractModel
      .findOne({
        _id: new Types.ObjectId(contractId),
        accountId: new Types.ObjectId(accountId),
      })
      .exec();

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Check contract-tenant link exists
    const contractTenant = await this.contractTenantModel
      .findOne({
        contractId: new Types.ObjectId(contractId),
        tenantId: new Types.ObjectId(tenantId),
      })
      .exec();

    if (!contractTenant) {
      throw new NotFoundException('Tenant not found in contract');
    }

    // Cannot remove PRIMARY when contract is ACTIVE
    if (
      contractTenant.role === TenantRole.PRIMARY &&
      contract.status === ContractStatus.ACTIVE
    ) {
      throw new AppBadRequestException(ErrorCode.CONTRACT_CANNOT_REMOVE_PRIMARY);
    }

    // Remove link
    await this.contractTenantModel.deleteOne({
      contractId: new Types.ObjectId(contractId),
      tenantId: new Types.ObjectId(tenantId),
    });

    return { status: 'REMOVED' };
  }

  async activate(
    contractId: string,
    activateDto: ActivateContractDto,
    accountId: string,
  ): Promise<{ status: string }> {
    this.logger.log(`Activating contract ${contractId}`);

    // Check contract exists and belongs to account
    const contract = await this.contractModel
      .findOne({
        _id: new Types.ObjectId(contractId),
        accountId: new Types.ObjectId(accountId),
      })
      .exec();

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.status !== ContractStatus.DRAFT) {
      throw new AppBadRequestException(ErrorCode.CONTRACT_INVALID_STATUS);
    }

    // Check has PRIMARY tenant
    const primaryTenant = await this.contractTenantModel
      .findOne({
        contractId: new Types.ObjectId(contractId),
        role: TenantRole.PRIMARY,
      })
      .exec();

    if (!primaryTenant) {
      throw new AppBadRequestException(ErrorCode.CONTRACT_NO_PRIMARY_TENANT);
    }

    // Check no active contract for this room
    const activeContract = await this.contractModel
      .findOne({
        roomId: contract.roomId,
        accountId: new Types.ObjectId(accountId),
        status: ContractStatus.ACTIVE,
        _id: { $ne: new Types.ObjectId(contractId) },
      })
      .exec();

    if (activeContract) {
      throw new AppBadRequestException(ErrorCode.CONTRACT_ROOM_ALREADY_ACTIVE);
    }

    // Get room to capture pricing snapshot
    const room = await this.roomModel.findById(contract.roomId).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check if room has METERED services
    const meteredServices = room.templateSnapshot.services?.filter(
      (s: any) => s.type === 'METERED',
    ) || [];

    // Validate: If there are METERED services, initialMeterReadings is required
    if (meteredServices.length > 0) {
      if (!activateDto.initialMeterReadings || activateDto.initialMeterReadings.length === 0) {
        throw new AppBadRequestException(ErrorCode.CONTRACT_INITIAL_METER_READINGS_REQUIRED);
      }

      // Validate: All METERED services must have initial readings
      const providedKeys = new Set(
        activateDto.initialMeterReadings.map((r) => r.key),
      );
      const requiredKeys = meteredServices.map((s: any) => s.key || s.name);
      const missingKeys = requiredKeys.filter((key) => !providedKeys.has(key));

      if (missingKeys.length > 0) {
        throw new AppBadRequestException(
          ErrorCode.CONTRACT_INITIAL_METER_READINGS_INCOMPLETE,
          `Missing initial meter readings for: ${missingKeys.join(', ')}`,
        );
      }
    }

    // Create pricing snapshot from room templateSnapshot
    const pricingSnapshot = {
      templateId: room.templateSnapshot.templateId,
      baseRent: room.templateSnapshot.baseRent,
      currency: room.templateSnapshot.currency,
      services: room.templateSnapshot.services || [],
    };

    // Update contract to ACTIVE and lock pricing snapshot
    await this.contractModel.updateOne(
      { _id: new Types.ObjectId(contractId) },
      {
        $set: {
          status: ContractStatus.ACTIVE,
          pricingSnapshot,
        },
      },
    );

    // Set initial meter readings (required if METERED services exist)
    if (activateDto.initialMeterReadings && activateDto.initialMeterReadings.length > 0) {
      // Merge with existing meterReadings if any
      const existingMeterReadings = room.meterReadings || {};
      const meterReadings: { [key: string]: number } = { ...existingMeterReadings };
      
      for (const reading of activateDto.initialMeterReadings) {
        meterReadings[reading.key] = reading.reading;
      }

      // Update room with initial meter readings
      await this.roomModel.updateOne(
        { _id: contract.roomId },
        { $set: { meterReadings } },
      );
    }

    // Update room status to OCCUPIED
    await this.roomModel.updateOne(
      { _id: contract.roomId },
      { $set: { status: RoomStatus.OCCUPIED } },
    );

    return { status: ContractStatus.ACTIVE };
  }

  async end(contractId: string, accountId: string): Promise<{ status: string }> {
    this.logger.log(`Ending contract ${contractId}`);

    // Check contract exists and belongs to account
    const contract = await this.contractModel
      .findOne({
        _id: new Types.ObjectId(contractId),
        accountId: new Types.ObjectId(accountId),
      })
      .exec();

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new AppBadRequestException(ErrorCode.CONTRACT_INVALID_STATUS);
    }

    // Update contract to ENDED
    await this.contractModel.updateOne(
      { _id: new Types.ObjectId(contractId) },
      { $set: { status: ContractStatus.ENDED } },
    );

    // Update room status to VACANT
    await this.roomModel.updateOne(
      { _id: contract.roomId },
      { $set: { status: RoomStatus.VACANT } },
    );

    return { status: ContractStatus.ENDED };
  }

  async terminate(
    contractId: string,
    terminateDto: TerminateContractDto,
    accountId: string,
  ): Promise<{ status: string }> {
    this.logger.log(`Terminating contract ${contractId}`);

    // Check contract exists and belongs to account
    const contract = await this.contractModel
      .findOne({
        _id: new Types.ObjectId(contractId),
        accountId: new Types.ObjectId(accountId),
      })
      .exec();

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new AppBadRequestException(ErrorCode.CONTRACT_INVALID_STATUS);
    }

    // Update contract to TERMINATED
    const updateData: any = {
      status: ContractStatus.TERMINATED,
      terminatedAt: new Date(),
    };

    // Only set reason if provided
    if (terminateDto.reason) {
      updateData.reason = terminateDto.reason;
    } else {
      updateData.reason = null;
    }

    await this.contractModel.updateOne(
      { _id: new Types.ObjectId(contractId) },
      { $set: updateData },
    );

    // Update room status to VACANT
    await this.roomModel.updateOne(
      { _id: contract.roomId },
      { $set: { status: RoomStatus.VACANT } },
    );

    return { status: ContractStatus.TERMINATED };
  }

  async findOne(contractId: string, accountId: string): Promise<any> {
    this.logger.log(`Finding contract ${contractId}`);

    // Get contract
    const contract = await this.contractModel
      .findOne({
        _id: new Types.ObjectId(contractId),
        accountId: new Types.ObjectId(accountId),
      })
      
      .exec();

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Get tenants with populated tenant data
    const contractTenants = await this.contractTenantModel
      .find({ contractId: new Types.ObjectId(contractId) })
      .populate('tenantId')
      .exec();

    const tenants = contractTenants.map((ct) => {
      const tenant = ct.tenantId as any;
      return {
        tenantId: tenant._id.toString(),
        name: tenant.fullName,
        phone: tenant.phone,
        role: ct.role,
      };
    });

    return {
      id: contract._id.toString(),
      roomId: contract.roomId.toString(),
      status: contract.status,
      tenants,
      startDate: contract.startDate,
      endDate: contract.endDate,
      terminatedAt: contract.terminatedAt || null,
      reason: contract.reason || null,
    };
  }
}

