import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LandlordsService } from './landlords.service';
import { Tenant, TenantSchema } from '../auth/schemas/tenant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }]),
  ],
  providers: [LandlordsService],
  exports: [LandlordsService],
})
export class LandlordsModule {}

