import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type VotesDocument = HydratedDocument<Votes>;

@Schema()
export class Votes {
    @Prop({ required: true })
    voterId: string;

    @Prop({ required: true })
    pollId: string;

    @Prop({ required: true })
    selectedOption: string;

    @Prop({ required: true })
    timestamp: Date;

    @Prop({ required: true })
    weight: number;

    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    voteCommitment: string;
}
export const VotesSchema = SchemaFactory.createForClass(Votes);