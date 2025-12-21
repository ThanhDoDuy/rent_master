import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  OWNER = 'OWNER',
  TENANT = 'TENANT',
}

@Schema({ timestamps: true })
export class User {
  // id is automatically created by MongoDB as _id
  @Prop({ required: true, index: true })
  phone: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.OWNER })
  role: UserRole;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Account', index: true })
  accountId: Types.ObjectId;

  // createdAt is automatically added by timestamps: true
}

export const UserSchema = SchemaFactory.createForClass(User);

