import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TenantDocument = Tenant & Document;

@Schema({ timestamps: true })
export class Tenant {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: 'VN' })
  countryCode: string;

  @Prop({ default: 'VND' })
  currency: string;

  @Prop({ default: 'Asia/Ho_Chi_Minh' })
  timezone: string;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
