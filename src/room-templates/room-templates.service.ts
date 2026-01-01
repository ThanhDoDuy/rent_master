import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RoomTemplate, RoomTemplateDocument } from './schemas/room-template.schema';
import { CreateRoomTemplateDto } from './dto/create-room-template.dto';
import { UpdateRoomTemplateDto } from './dto/update-room-template.dto';
import { AppBadRequestException } from '../common/exceptions/app.exception';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class RoomTemplatesService {
    private readonly logger = new Logger(RoomTemplatesService.name);

    constructor(
        @InjectModel(RoomTemplate.name)
        private roomTemplateModel: Model<RoomTemplateDocument>,
    ) { }

    async findAll(accountId: string, propertyId?: string): Promise<any[]> {
        this.logger.log(`Finding all room templates for accountId: ${accountId}, propertyId: ${propertyId || 'all'}`);
        const query: any = { accountId: new Types.ObjectId(accountId) };
        if (propertyId) {
            query.propertyId = new Types.ObjectId(propertyId);
        }
        const templates = await this.roomTemplateModel
            .find(query)
            .sort({ createdAt: -1 })
            .exec();
        return templates.map((template: RoomTemplateDocument) => this.toResponse(template, false));
    }

    async findOne(id: string, accountId: string): Promise<any> {
        this.logger.log(`Finding room template ${id} for accountId: ${accountId}`);
        const template = await this.roomTemplateModel
            .findOne({
                _id: new Types.ObjectId(id),
                accountId: new Types.ObjectId(accountId),
            })
            .exec();

        if (!template) {
            throw new NotFoundException('Room template not found');
        }
        return this.toResponse(template, true);
    }

    async create(
        createRoomTemplateDto: CreateRoomTemplateDto,
        accountId: string,
    ): Promise<any> {
        this.logger.log(`Creating room template for accountId: ${accountId}, propertyId: ${createRoomTemplateDto.propertyId}`);
        const cleanedData = this.cleanServicesData(createRoomTemplateDto);
        const { propertyId, ...restData } = cleanedData;
        const template = await this.roomTemplateModel.create({
            ...restData,
            accountId: new Types.ObjectId(accountId),
            propertyId: new Types.ObjectId(propertyId),
        });

        return this.toResponse(template, false);
    }

    async update(
        id: string,
        updateRoomTemplateDto: UpdateRoomTemplateDto,
        accountId: string,
    ): Promise<any> {
        this.logger.log(`Updating room template ${id} for accountId: ${accountId}`);
        const cleanedData = this.cleanServicesData(updateRoomTemplateDto);
        const template = await this.roomTemplateModel
            .findOneAndUpdate(
                {
                    _id: new Types.ObjectId(id),
                    accountId: new Types.ObjectId(accountId),
                },
                { $set: cleanedData },
                { new: true },
            )
            .exec();

        if (!template) {
            throw new NotFoundException('Room template not found');
        }

        return this.toResponse(template, false);
    }

    async remove(id: string, accountId: string): Promise<{ id: string }> {
        this.logger.log(`Deleting room template ${id} for accountId: ${accountId}`);

        // Check if template exists and belongs to account
        const template = await this.roomTemplateModel
            .findOne({
                _id: new Types.ObjectId(id),
                accountId: new Types.ObjectId(accountId),
            })
            .exec();

        if (!template) {
            throw new NotFoundException('Room template not found');
        }

        // Check if template is used in rooms or contracts
        // Note: This will work once Room and Contract schemas are created
        const db = this.roomTemplateModel.db;

        // Check for rooms that reference this template
        const roomsCollection = db.collection('rooms');
        const roomCount = await roomsCollection.countDocuments({
            'template_snapshot.templateId': id,
            accountId: new Types.ObjectId(accountId),
        });

        if (roomCount > 0) {
            throw new AppBadRequestException(ErrorCode.TEMPLATE_IN_USE);
        }

        // Check for contracts that reference this template
        const contractsCollection = db.collection('contracts');
        const contractCount = await contractsCollection.countDocuments({
            'pricing_snapshot.templateId': id,
            accountId: new Types.ObjectId(accountId),
        });

        if (contractCount > 0) {
            throw new AppBadRequestException(ErrorCode.TEMPLATE_IN_USE);
        }

        // Safe to delete
        await this.roomTemplateModel.deleteOne({
            _id: new Types.ObjectId(id),
            accountId: new Types.ObjectId(accountId),
        });

        return { id };
    }

    private cleanServicesData(dto: CreateRoomTemplateDto | UpdateRoomTemplateDto): any {
        const cleaned = { ...dto };
        
        if (cleaned.services && Array.isArray(cleaned.services)) {
            cleaned.services = cleaned.services.map((service: any) => {
                const cleanedService: any = {
                    name: service.name,
                    type: service.type,
                };

                // Only include fields that are not null/undefined
                if (service.unit != null) cleanedService.unit = service.unit;
                if (service.unitPrice != null) cleanedService.unitPrice = service.unitPrice;
                if (service.amount != null) cleanedService.amount = service.amount;

                return cleanedService;
            });
        }

        return cleaned;
    }

    private toResponse(template: RoomTemplateDocument, includeServices: boolean): any {
        const response: any = {
            id: template._id.toString(),
            name: template.name,
            baseRent: template.baseRent,
            currency: template.currency,
        };

        if (template.area != null) {
            response.area = template.area;
        }

        if (includeServices && template.services) {
            response.services = template.services.map((service: any) => {
                const cleanedService: any = {
                    name: service.name,
                    type: service.type,
                };

                // Only include fields that are not null/undefined
                if (service.unit != null) cleanedService.unit = service.unit;
                if (service.unitPrice != null) cleanedService.unitPrice = service.unitPrice;
                if (service.amount != null) cleanedService.amount = service.amount;

                return cleanedService;
            });
        }

        return response;
    }
}

