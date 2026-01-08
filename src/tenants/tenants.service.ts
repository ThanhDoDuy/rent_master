import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from './schemas/tenant.schema';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AppConflictException, AppBadRequestException } from '../common/exceptions/app.exception';
import { ErrorCode } from '../common/constants/error-codes';
import { ContractTenant, ContractTenantDocument } from '../contracts/schemas/contract-tenant.schema';
import { Contract, ContractDocument, ContractStatus } from '../contracts/schemas/contract.schema';

@Injectable()
export class TenantsService {
    private readonly logger = new Logger(TenantsService.name);

    constructor(
        @InjectModel(Tenant.name)
        private tenantModel: Model<TenantDocument>,
        @InjectModel(ContractTenant.name)
        private contractTenantModel: Model<ContractTenantDocument>,
        @InjectModel(Contract.name)
        private contractModel: Model<ContractDocument>,
    ) { }

    async findAll(accountId: string, excludeRoomId?: string): Promise<any[]> {
        this.logger.log(`Finding all tenants for accountId: ${accountId}`);
        const tenants = await this.tenantModel
            .find({ accountId: new Types.ObjectId(accountId) })
            .sort({ createdAt: -1 })
            .exec();

        // Check which tenants have active contracts or are in other rooms
        const tenantIds = tenants.map(t => t._id);
        const contractTenants = await this.contractTenantModel
            .find({ tenantId: { $in: tenantIds } })
            .exec();

        // Get contract IDs from contractTenants
        const contractIds = contractTenants.map(ct => ct.contractId).filter(Boolean);
        
        if (contractIds.length === 0) {
            // No contracts, all tenants are available
            return tenants.map((tenant: TenantDocument) => this.toListResponse(tenant, false));
        }

        // Get all active/draft contracts
        const activeContracts = await this.contractModel
            .find({
                _id: { $in: contractIds },
                status: { $in: [ContractStatus.ACTIVE, ContractStatus.DRAFT] },
            })
            .exec();

        // Create a map of contractId -> contract for quick lookup
        const contractMap = new Map<string, any>();
        activeContracts.forEach(contract => {
            contractMap.set(contract._id.toString(), contract);
        });

        // Map tenant to room (if tenant has active contract in a different room)
        const tenantRoomMap = new Map<string, string>(); // tenantId -> roomId

        for (const ct of contractTenants) {
            const contractId = ct.contractId.toString();
            const contract = contractMap.get(contractId);
            
            if (contract) {
                const tenantId = ct.tenantId.toString();
                const roomId = contract.roomId?.toString();
                // If excludeRoomId is provided, only mark as unavailable if in a different room
                if (roomId && (!excludeRoomId || roomId !== excludeRoomId)) {
                    tenantRoomMap.set(tenantId, roomId);
                }
            }
        }

        return tenants.map((tenant: TenantDocument) => {
            const tenantId = tenant._id.toString();
            // Check if tenant has active contract OR has roomId (from occupants or contract)
            const hasActiveContract = tenantRoomMap.has(tenantId);
            const hasRoom = tenant.roomId && (!excludeRoomId || tenant.roomId.toString() !== excludeRoomId);
            const isUnavailable = hasActiveContract || hasRoom;
            return this.toListResponse(tenant, isUnavailable);
        });
    }

    async findOne(tenantId: string, accountId: string): Promise<any> {
        this.logger.log(`Finding tenant ${tenantId} for accountId: ${accountId}`);
        const tenant = await this.tenantModel
            .findOne({
                _id: new Types.ObjectId(tenantId),
                accountId: new Types.ObjectId(accountId),
            })
            .exec();

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        return this.toDetailResponse(tenant);
    }

    async getContractHistory(tenantId: string, accountId: string): Promise<any[]> {
        this.logger.log(`Getting contract history for tenant ${tenantId}, accountId: ${accountId}`);

        // Verify tenant exists and belongs to account
        const tenant = await this.tenantModel
            .findOne({
                _id: new Types.ObjectId(tenantId),
                accountId: new Types.ObjectId(accountId),
            })
            .exec();

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        // Query contract_tenants collection (read-only)
        const db = this.tenantModel.db;
        const contractTenantsCollection = db.collection('contract_tenants');
        const contractsCollection = db.collection('contracts');
        const roomsCollection = db.collection('rooms');

        // Get all contract_tenants for this tenant
        const contractTenants = await contractTenantsCollection
            .find({
                tenantId: tenantId,
            })
            .toArray();

        // Get contract details for each contract_tenant
        const contracts = await Promise.all(
            contractTenants.map(async (ct: any) => {
                const contract = await contractsCollection.findOne({
                    _id: new Types.ObjectId(ct.contractId),
                    accountId: new Types.ObjectId(accountId),
                });

                if (!contract) {
                    return null;
                }

                // Get room name
                const room = await roomsCollection.findOne({
                    _id: new Types.ObjectId(contract.roomId),
                    accountId: new Types.ObjectId(accountId),
                });

                return {
                    contractId: contract._id.toString(),
                    roomName: room?.name || 'Unknown',
                    role: ct.role || 'OCCUPANT',
                    startDate: contract.startDate,
                    endDate: contract.endDate,
                };
            })
        );

        // Filter out null contracts
        return contracts.filter((c) => c !== null);
    }

    async create(
        createTenantDto: CreateTenantDto,
        accountId: string,
    ): Promise<any> {
        this.logger.log(`Creating tenant for accountId: ${accountId}`);
        
        const accountObjectId = new Types.ObjectId(accountId);
        
        // Validate documentType and documentNumber logic
        if (createTenantDto.documentType && !createTenantDto.documentNumber) {
            throw new AppBadRequestException(
                ErrorCode.VALIDATION_INVALID_INPUT,
                'Nếu có loại giấy tờ thì phải có số giấy tờ'
            );
        }
        
        if (!createTenantDto.documentType && createTenantDto.documentNumber) {
            throw new AppBadRequestException(
                ErrorCode.VALIDATION_INVALID_INPUT,
                'Nếu có số giấy tờ thì phải có loại giấy tờ'
            );
        }
        
        // Validate documentType enum
        if (createTenantDto.documentType && 
            !['CCCD', 'PASSPORT'].includes(createTenantDto.documentType)) {
            throw new AppBadRequestException(
                ErrorCode.VALIDATION_INVALID_INPUT,
                'Loại giấy tờ phải là CCCD hoặc PASSPORT'
            );
        }
        
        // Validate documentNumber format based on documentType
        if (createTenantDto.documentType && createTenantDto.documentNumber) {
            if (createTenantDto.documentType === 'CCCD') {
                // CCCD: 12 digits
                if (!/^\d{12}$/.test(createTenantDto.documentNumber)) {
                    throw new AppBadRequestException(
                        ErrorCode.VALIDATION_INVALID_INPUT,
                        'Số CCCD phải có đúng 12 chữ số'
                    );
                }
            } else if (createTenantDto.documentType === 'PASSPORT') {
                // Passport: 8-9 alphanumeric characters
                if (!/^[A-Z0-9]{8,9}$/.test(createTenantDto.documentNumber.toUpperCase())) {
                    throw new AppBadRequestException(
                        ErrorCode.VALIDATION_INVALID_INPUT,
                        'Số Passport không hợp lệ (8-9 ký tự, chữ và số)'
                    );
                }
            }
        }
        
        // Validate phone format
        if (!/^0[3-9]\d{8,9}$/.test(createTenantDto.phone)) {
            throw new AppBadRequestException(
                ErrorCode.VALIDATION_INVALID_INPUT,
                'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0)'
            );
        }
        
        // Check for duplicate phone before creating
        const existingTenantByPhone = await this.tenantModel
            .findOne({
                accountId: accountObjectId,
                phone: createTenantDto.phone,
            })
            .exec();
        
        if (existingTenantByPhone) {
            throw new AppConflictException(ErrorCode.TENANT_PHONE_DUPLICATE);
        }
        
        // Check for duplicate document if both fields are provided
        if (createTenantDto.documentType && createTenantDto.documentNumber) {
            const existingTenantByDocument = await this.tenantModel
                .findOne({
                    accountId: accountObjectId,
                    documentType: createTenantDto.documentType,
                    documentNumber: createTenantDto.documentNumber.toUpperCase(),
                })
                .exec();
            
            if (existingTenantByDocument) {
                throw new AppConflictException(ErrorCode.TENANT_DOCUMENT_DUPLICATE);
            }
        }
        
        try {
            // Normalize documentNumber to uppercase for Passport
            const normalizedData = {
                ...createTenantDto,
                documentNumber: createTenantDto.documentNumber 
                    ? (createTenantDto.documentType === 'PASSPORT' 
                        ? createTenantDto.documentNumber.toUpperCase() 
                        : createTenantDto.documentNumber)
                    : undefined,
                accountId: accountObjectId,
            };
            
            const tenant = await this.tenantModel.create(normalizedData);

            return this.toListResponse(tenant);
        } catch (error: any) {
            // Handle duplicate key errors (fallback in case indexes are created)
            if (error.code === 11000) {
                const keyPattern = error.keyPattern;
                
                if (keyPattern?.phone) {
                    throw new AppConflictException(ErrorCode.TENANT_PHONE_DUPLICATE);
                }
                
                if (keyPattern?.documentType || keyPattern?.documentNumber) {
                    throw new AppConflictException(ErrorCode.TENANT_DOCUMENT_DUPLICATE);
                }
            }
            
            // Re-throw other errors
            throw error;
        }
    }

    async update(
        tenantId: string,
        updateTenantDto: UpdateTenantDto,
        accountId: string,
    ): Promise<any> {
        this.logger.log(`Updating tenant ${tenantId} for accountId: ${accountId}`);

        try {
            const tenant = await this.tenantModel
                .findOneAndUpdate(
                    {
                        _id: new Types.ObjectId(tenantId),
                        accountId: new Types.ObjectId(accountId),
                    },
                    { $set: updateTenantDto },
                    { new: true },
                )
                .exec();

            if (!tenant) {
                throw new NotFoundException('Tenant not found');
            }

            return this.toListResponse(tenant);
        } catch (error: any) {
            // Handle duplicate key errors
            if (error.code === 11000) {
                const keyPattern = error.keyPattern;
                
                if (keyPattern?.phone) {
                    throw new AppConflictException(ErrorCode.TENANT_PHONE_DUPLICATE);
                }
                
                if (keyPattern?.documentType || keyPattern?.documentNumber) {
                    throw new AppConflictException(ErrorCode.TENANT_DOCUMENT_DUPLICATE);
                }
            }
            
            // Re-throw other errors
            throw error;
        }
    }

    async remove(tenantId: string, accountId: string): Promise<{ id: string }> {
        this.logger.log(`Deleting tenant ${tenantId} for accountId: ${accountId}`);

        // Check if tenant exists and belongs to account
        const tenant = await this.tenantModel
            .findOne({
                _id: new Types.ObjectId(tenantId),
                accountId: new Types.ObjectId(accountId),
            })
            .exec();

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        // Check if tenant has any contract history
        const db = this.tenantModel.db;
        const contractTenantsCollection = db.collection('contract_tenants');
        const contractCount = await contractTenantsCollection.countDocuments({
            tenantId: tenantId,
        });

        if (contractCount > 0) {
            throw new AppConflictException(ErrorCode.TENANT_HAS_CONTRACT_HISTORY);
        }

        // Safe to delete
        await this.tenantModel.deleteOne({
            _id: new Types.ObjectId(tenantId),
            accountId: new Types.ObjectId(accountId),
        });

        return { id: tenantId };
    }

    async bulkRemove(tenantIds: string[], accountId: string): Promise<any> {
        this.logger.log(`Bulk deleting ${tenantIds.length} tenants for accountId: ${accountId}`);

        const accountObjectId = new Types.ObjectId(accountId);
        const db = this.tenantModel.db;
        const contractTenantsCollection = db.collection('contract_tenants');

        const results = {
            success: [] as string[],
            failed: [] as Array<{ id: string; reason: string }>,
        };

        for (const tenantId of tenantIds) {
            try {
                // Check if tenant exists and belongs to account
                const tenant = await this.tenantModel
                    .findOne({
                        _id: new Types.ObjectId(tenantId),
                        accountId: accountObjectId,
                    })
                    .exec();

                if (!tenant) {
                    results.failed.push({
                        id: tenantId,
                        reason: 'Tenant not found',
                    });
                    continue;
                }

                // Check if tenant has any contract history
                const contractCount = await contractTenantsCollection.countDocuments({
                    tenantId: tenantId,
                });

                if (contractCount > 0) {
                    results.failed.push({
                        id: tenantId,
                        reason: 'Tenant has contract history',
                    });
                    continue;
                }

                // Safe to delete
                await this.tenantModel.deleteOne({
                    _id: new Types.ObjectId(tenantId),
                    accountId: accountObjectId,
                });

                results.success.push(tenantId);
            } catch (error: any) {
                this.logger.error(`Error deleting tenant ${tenantId}:`, error.message);
                results.failed.push({
                    id: tenantId,
                    reason: error.message || 'Unknown error',
                });
            }
        }

        return {
            deleted: results.success.length,
            failedCount: results.failed.length,
            success: results.success,
            failed: results.failed,
        };
    }

    private toListResponse(tenant: TenantDocument, hasActiveContract: boolean = false): any {
        return {
            id: tenant._id.toString(),
            fullName: tenant.fullName,
            phone: tenant.phone,
            hasActiveContract, // Indicates if tenant has an active contract in another room
        };
    }

    private toDetailResponse(tenant: TenantDocument): any {
        return {
            id: tenant._id.toString(),
            fullName: tenant.fullName,
            phone: tenant.phone,
            documentType: tenant.documentType,
            documentNumber: tenant.documentNumber,
            createdAt: (tenant as any).createdAt,
            updatedAt: (tenant as any).updatedAt,
        };
    }
}

