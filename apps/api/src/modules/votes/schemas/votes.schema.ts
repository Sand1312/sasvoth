import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type VotesDocument = HydratedDocument<Votes>;

@Schema()
export class Votes {
    @Prop({ required: true })
    pollId: string;

    @Prop({ required: true })
    selectedOption: number;

    @Prop({ required: true })
    voiceCredits: number;

}
export const VotesSchema = SchemaFactory.createForClass(Votes);