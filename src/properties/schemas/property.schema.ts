import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PropertyDocument = Property & Document;

@Schema({ timestamps: true })
export class Property {
  // id is automatically created by MongoDB as _id
  @Prop({ type: Types.ObjectId, required: true, ref: 'Account', index: true })
  accountId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  address?: string;

  @Prop({ required: false })
  note?: string;

  // createdAt is automatically added by timestamps: true
}

export const PropertySchema = SchemaFactory.createForClass(Property);

// Indexes
PropertySchema.index({ accountId: 1 });
PropertySchema.index({ accountId: 1, name: 1 });

