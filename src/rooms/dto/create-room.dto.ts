import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RoomStatus } from '../schemas/room.schema';

class ServicesDto {
  @IsNumber()
  @IsOptional()
  electricityRate?: number;

  @IsNumber()
  @IsOptional()
  waterRate?: number;
}

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  buildingId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  baseRent: number;

  @IsEnum(RoomStatus)
  @IsOptional()
  status?: RoomStatus;

  @ValidateNested()
  @Type(() => ServicesDto)
  @IsOptional()
  services?: ServicesDto;
}
