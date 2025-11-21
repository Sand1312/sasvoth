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

    @Prop({ required: false ,type:[String]})
    ideas: string[];// danh sách chờ duyệt

    @Prop({ required: false ,type:[String]})
    options:string[];// danh sách option đã được duyệt

    @Prop({required:false, equals:true})
    pollIdOnChain: number;

    @Prop({ required: false })
    createdAt: Date;

    @Prop({required:false,type:String})
    pollAddressOnchain: string;
}

export const PollsSchema = SchemaFactory.createForClass(Polls);
