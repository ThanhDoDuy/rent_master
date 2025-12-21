import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class BulkDeleteTenantsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tenantIds: string[];
}

