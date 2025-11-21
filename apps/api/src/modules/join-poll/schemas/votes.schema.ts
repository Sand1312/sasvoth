import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type JoinPollsDocument = HydratedDocument<JoinPolls>;

@Schema()
export class JoinPolls {
    @Prop({ required: true })
    voterId: string;

    @Prop({ required: true })
    pollId: string;

    @Prop({ required: true })
    selectedOption: string;

    @Prop({ required: true })
    timestamp: Date;

    @Prop({ required: true })
    voiceCredits: number;



    @Prop({ required: true })
    voteCommitment: string;
}
export const JoinPollsSchema = SchemaFactory.createForClass(JoinPolls);