import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PhoneOtpDocument = PhoneOtp & Document;

@Schema({ timestamps: true })
export class PhoneOtp {
  @Prop({ required: true, index: true })
  phone: string;

  @Prop({ required: true })
  otpCode: string;

  @Prop({ required: true, index: { expireAfterSeconds: 180 } })
  expiresAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const PhoneOtpSchema = SchemaFactory.createForClass(PhoneOtp);

// Create TTL index for automatic expiration (3 minutes)
PhoneOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

