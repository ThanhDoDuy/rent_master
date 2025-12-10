import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantProfilesController } from './tenant-profiles.controller';
import { TenantProfilesService } from './tenant-profiles.service';
import {
  TenantProfile,
  TenantProfileSchema,
} from './schemas/tenant-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TenantProfile.name, schema: TenantProfileSchema },
    ]),
  ],
  controllers: [TenantProfilesController],
  providers: [TenantProfilesService],
  exports: [TenantProfilesService],
})
export class TenantProfilesModule {}

