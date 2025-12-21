import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccountDocument = Account & Document;

@Schema({ timestamps: true })
export class Account {
  // id is automatically created by MongoDB as _id
  // createdAt is automatically added by timestamps: true
}

export const AccountSchema = SchemaFactory.createForClass(Account);

