import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserSessionDocument = UserSession & Document;

@Schema({ timestamps: true })
export class UserSession {
  // id is automatically created by MongoDB as _id
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  nonce: string;

  // createdAt is automatically added by timestamps: true
  @Prop({ required: true })
  expiredAt: Date;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);

// Indexes
UserSessionSchema.index({ userId: 1 });
UserSessionSchema.index({ nonce: 1 }, { unique: true });
UserSessionSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

