import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpSessionDocument = OtpSession & Document;

@Schema({ timestamps: true })
export class OtpSession {
  @Prop({ required: true, unique: true, index: true })
  phone: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop()
  verifiedAt?: Date;

  @Prop({ required: true, index: { expireAfterSeconds: 600 } })
  expiresAt: Date;
}

export const OtpSessionSchema = SchemaFactory.createForClass(OtpSession);

// Create TTL index for automatic expiration (10 minutes)
OtpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

