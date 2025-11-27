import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type JoinPollDocument = HydratedDocument<JoinPoll>;

@Schema()
export class JoinPoll {
    @Prop({ required: true })
    voterId: string;

    @Prop({ required: true })
    pollId: string;

    @Prop({ required: true })
    timestamp: Date;

    @Prop({ required: true })
    voteCommitment: string;

    @Prop({ required: true })
    pollIdOnchain: string;
}
export const JoinPollSchema = SchemaFactory.createForClass(JoinPoll);