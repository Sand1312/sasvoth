import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type VoiceCreditsDocument = HydratedDocument<VoiceCredits>;

@Schema({ timestamps: true })
export class VoiceCredits {
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
  usedCredits: number;
}

export const VoiceCreditsSchema = SchemaFactory.createForClass(VoiceCredits);
