import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'task_created_events', timestamps: true }) // activa timestamps (createdAt, updatedAt)
export class TaskCreatedEvent {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] })
  status: string;
}

export type TaskCreatedEventDocument = TaskCreatedEvent & Document;
export const TaskCreatedEventSchema = SchemaFactory.createForClass(TaskCreatedEvent);
