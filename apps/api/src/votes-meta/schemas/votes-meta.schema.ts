import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type VotesMetaDocument = HydratedDocument<VotesMeta>;

@Schema()
export class VotesMeta {
  @Prop({ required: true, unique: true })
  voteId: string; // UUID

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'VotingEvent',
    required: true,
  })
  votingEventId: string;

  @Prop({ required: true })
  voteCid: string;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

export const VotesMetaSchema = SchemaFactory.createForClass(VotesMeta);
