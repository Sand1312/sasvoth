import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PollsDocument = HydratedDocument<Polls>;

@Schema()
export class Polls {
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


}

export const PollsSchema = SchemaFactory.createForClass(Polls);
