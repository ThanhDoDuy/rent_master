import { IsString, IsOptional, IsNumber, IsEnum, ValidateNested } from 'class-validator';
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

export class UpdateRoomDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  baseRent?: number;

  @IsEnum(RoomStatus)
  @IsOptional()
  status?: RoomStatus;

  @ValidateNested()
  @Type(() => ServicesDto)
  @IsOptional()
  services?: ServicesDto;
}
