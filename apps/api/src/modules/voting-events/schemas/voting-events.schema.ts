import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type VotingEventsDocument = HydratedDocument<VotingEvents>;

@Schema()
export class VotingEvents {
    @Prop({ required: false })
    title: string;

    @Prop({ required: false })
    description: string;

    @Prop({ required: true })
    creatorAddress: string;

    @Prop({ required:true})
    status: string;

    @Prop({ required: true })
    startTime: Date;

    @Prop({ required: true })
    endTime: Date;

    @Prop({ required: true ,type:[String]})
    options: string[];

    @Prop({required:true, equals:true})
    pollIdOnChain: number;

    @Prop({ required: false })
    createdAt: Date;



}

export const VotingEventsSchema = SchemaFactory.createForClass(VotingEvents);
