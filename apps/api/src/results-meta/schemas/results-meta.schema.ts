import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ResultsMetaDocument = HydratedDocument<ResultsMeta>;

@Schema()
export class ResultsMeta {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'VotingEvent',
    required: true,
    unique: true,
  })
  votingEventId: string;

  @Prop({ required: true })
  resultCid: string;

  @Prop({ type: Object, required: true }) // JSON object
  cachedResult: any;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

export const ResultsMetaSchema = SchemaFactory.createForClass(ResultsMeta);
