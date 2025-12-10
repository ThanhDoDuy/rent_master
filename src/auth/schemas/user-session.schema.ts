import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserSessionDocument = UserSession & Document;

@Schema({ timestamps: true })
export class UserSession {
  @Prop({ type: Types.ObjectId, required: true, index: true, ref: 'Tenant' })
  tenantId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  nonce: string;

  @Prop({ default: Date.now, expires: 604800 }) // 7 days TTL
  expiresAt: Date;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);

// Indexes
UserSessionSchema.index({ tenantId: 1 });
UserSessionSchema.index({ nonce: 1 }, { unique: true });
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

