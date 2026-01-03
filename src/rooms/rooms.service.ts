import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument, RoomStatus } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomTemplate, RoomTemplateDocument } from '../room-templates/schemas/room-template.schema';
import { AppBadRequestException } from '../common/exceptions/app.exception';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class RoomsService {
    private readonly logger = new Logger(RoomsService.name);

    constructor(
        @InjectModel(Room.name)
        private roomModel: Model<RoomDocument>,
        @InjectModel(RoomTemplate.name)
        private roomTemplateModel: Model<RoomTemplateDocument>,
    ) { }

    async findAll(propertyId: string, accountId: string): Promise<any[]> {
        this.logger.log(`Finding all rooms for propertyId: ${propertyId}, accountId: ${accountId}`);
        const rooms = await this.roomModel
            .find({
                propertyId: new Types.ObjectId(propertyId),
                accountId: new Types.ObjectId(accountId),
            })
            .sort({ createdAt: -1 })
            .exec();

        return rooms.map((room: RoomDocument) => this.toListResponse(room));
    }

    async findOne(roomId: string, accountId: string): Promise<any> {
        this.logger.log(`Finding room ${roomId} for accountId: ${accountId}`);
        const room = await this.roomModel
            .findOne({
                _id: new Types.ObjectId(roomId),
                accountId: new Types.ObjectId(accountId),
            })
            .exec();

        if (!room) {
            throw new NotFoundException('Room not found');
        }

        return this.toDetailResponse(room);
    }

    async create(
        propertyId: string,
        createRoomDto: CreateRoomDto,
        accountId: string,
    ): Promise<any> {
        this.logger.log(`Creating room for propertyId: ${propertyId}, accountId: ${accountId}`);

        // Check if room name already exists in this property
        const existingRoom = await this.roomModel
            .findOne({
                propertyId: new Types.ObjectId(propertyId),
                accountId: new Types.ObjectId(accountId),
                name: createRoomDto.name.trim(),
            })
            .exec();

        if (existingRoom) {
            throw new AppBadRequestException(
                ErrorCode.ROOM_NAME_DUPLICATE,
                `Tên phòng "${createRoomDto.name}" đã tồn tại trong dãy trọ này. Vui lòng xóa phòng cũ trước khi tạo mới.`
            );
        }

        // Get template to create snapshot
        const template = await this.roomTemplateModel
            .findOne({
                _id: new Types.ObjectId(createRoomDto.templateId),
                accountId: new Types.ObjectId(accountId),
            })
            .exec();

        if (!template) {
            throw new NotFoundException('Room template not found');
        }

        // Create template snapshot (clean services to remove null fields)
        const templateSnapshot = {
            templateId: template._id.toString(),
            name: template.name,
            baseRent: template.baseRent,
            currency: template.currency,
            area: template.area, // Include area from template
            services: this.cleanServices(template.services || []),
        };

        // Create room with snapshot
        const room = await this.roomModel.create({
            accountId: new Types.ObjectId(accountId),
            propertyId: new Types.ObjectId(propertyId),
            name: createRoomDto.name,
            status: RoomStatus.VACANT,
            templateSnapshot,
            deposit: createRoomDto.deposit,
            note: createRoomDto.note,
        });

        return this.toListResponse(room);
    }

    async update(
        roomId: string,
        updateRoomDto: UpdateRoomDto,
        accountId: string,
    ): Promise<any> {
        this.logger.log(`Updating room ${roomId} for accountId: ${accountId}`);

        // Get existing room to preserve templateSnapshot structure
        const existingRoom = await this.roomModel
            .findOne({
                _id: new Types.ObjectId(roomId),
                accountId: new Types.ObjectId(accountId),
            })
            .exec();

        if (!existingRoom) {
            throw new NotFoundException('Room not found');
        }

        // Build update data
        const updateData: any = {};
        
        // Update note if provided
        if (updateRoomDto.note !== undefined) {
            updateData.note = updateRoomDto.note;
        }

        // Update templateSnapshot if templateId is provided
        if (updateRoomDto.templateId) {
            // Get the new template
            const template = await this.roomTemplateModel
                .findOne({
                    _id: new Types.ObjectId(updateRoomDto.templateId),
                    accountId: new Types.ObjectId(accountId),
                })
                .exec();

            if (!template) {
                throw new NotFoundException('Room template not found');
            }

            // Create new template snapshot from the selected template
            updateData.templateSnapshot = {
                templateId: template._id.toString(),
                name: template.name,
                baseRent: template.baseRent,
                currency: template.currency,
                area: template.area,
                services: this.cleanServices(template.services || []),
            };
        }

        const room = await this.roomModel
            .findOneAndUpdate(
                {
                    _id: new Types.ObjectId(roomId),
                    accountId: new Types.ObjectId(accountId),
                },
                { $set: updateData },
                { new: true },
            )
            .exec();

        if (!room) {
            throw new NotFoundException('Room not found');
        }

        return this.toListResponse(room);
    }

    async remove(roomId: string, accountId: string): Promise<{ id: string }> {
        this.logger.log(`Deleting room ${roomId} for accountId: ${accountId}`);

        // Check if room exists and belongs to account
        const room = await this.roomModel
            .findOne({
                _id: new Types.ObjectId(roomId),
                accountId: new Types.ObjectId(accountId),
            })
            .exec();

        if (!room) {
            throw new NotFoundException('Room not found');
        }

        // Check if room has contracts (even ENDED contracts)
        const db = this.roomModel.db;
        const contractsCollection = db.collection('contracts');
        const contractCount = await contractsCollection.countDocuments({
            roomId: new Types.ObjectId(roomId),
            accountId: new Types.ObjectId(accountId),
        });

        if (contractCount > 0) {
            throw new AppBadRequestException(ErrorCode.ROOM_IN_USE);
        }

        // Safe to delete
        await this.roomModel.deleteOne({
            _id: new Types.ObjectId(roomId),
            accountId: new Types.ObjectId(accountId),
        });

        return { id: roomId };
    }

    private toListResponse(room: RoomDocument): any {
        return {
            id: room._id.toString(),
            name: room.name,
            propertyId: room.propertyId.toString(),
            status: room.status,
            templateSnapshot: {
                ...room.templateSnapshot,
                services: this.cleanServices(room.templateSnapshot?.services || []),
            },
            note: room.note,
        };
    }

    private toDetailResponse(room: RoomDocument): any {
        return {
            id: room._id.toString(),
            name: room.name,
            propertyId: room.propertyId.toString(),
            status: room.status,
            templateSnapshot: {
                ...room.templateSnapshot,
                services: this.cleanServices(room.templateSnapshot?.services || []),
            },
            note: room.note,
            meterReadings: room.meterReadings,
            deposit: room.deposit,
        };
    }

    private cleanServices(services: any[]): any[] {
        if (!Array.isArray(services)) {
            return [];
        }

        return services.map((service: any) => {
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
}

