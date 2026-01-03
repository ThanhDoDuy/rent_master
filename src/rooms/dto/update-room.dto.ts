import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ServiceDto {
    @IsString()
    name: string;

    @IsString()
    type: 'METERED' | 'FIXED';

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    iconColor?: string;

    @IsString()
    @IsOptional()
    unit?: string;

    @IsNumber()
    @IsOptional()
    unitPrice?: number;

    @IsNumber()
    @IsOptional()
    amount?: number;
}

export class UpdateRoomDto {
    // Note: name cannot be updated after room creation
    // If you need to change the room name, delete and recreate the room
    
    @IsString()
    @IsOptional()
    note?: string;

    // Template ID - if provided, will update templateSnapshot from template
    @IsString()
    @IsOptional()
    templateId?: string;
}

