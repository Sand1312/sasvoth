import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type RewardDocument = HydratedDocument<Reward>;

@Schema({ timestamps: true })
export class Reward {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'VotingEvent',
    required: true,
  })
  votingEventId: string;

  @Prop({ required: true, min: 0 })
  creditCount: number;

  @Prop({ required: true, min: 0 })
  tokenAmount: number;

  @Prop({
    required: true,
    enum: ['pending', 'claimed', 'failed'],
    default: 'pending',
  })
  status: string;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);
