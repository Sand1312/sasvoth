import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PollsDocument = HydratedDocument<Polls>;

// MACI Configuration for poll deployment
export class MaciConfig {
    @Prop({ default: 1 })
    mode?: number; // 0 = Non-QV, 1 = QV

    @Prop({ default: 20 })
    messageBatchSize?: number;

    @Prop({ default: 10 })
    pollStateTreeDepth?: number;

    @Prop({ default: 2 })
    voteOptionTreeDepth?: number;

    @Prop({ default: 1 })
    tallyProcessingStateTreeDepth?: number;

    @Prop({ default: 100 })
    initialVoiceCredits?: number;
}

@Schema()
export class Polls {
    @Prop({ required: false })
    title: string;

    @Prop({ required: false })
    description: string;

    @Prop({ required: true })
    creatorAddress: string;

    @Prop({ required: true })
    status: string;

    @Prop({ required: true })
    startTime: Date;

    @Prop({ required: true })
    endTime: Date;

    @Prop({ required: false, type: [String] })
    ideas: string[];// danh sách chờ duyệt

    @Prop({ required: false, type: [String] })
    options: string[];// danh sách option đã được duyệt

    @Prop()
    numberOptions: number;

    @Prop({ required: false, equals: true })
    pollIdOnChain: number;

    @Prop({ required: false })
    createdAt: Date;

    // @Prop({required:false,type:String})
    // pollAddressOnchain: string;

    @Prop({ required: false })
    subgraphUrl: string;

    @Prop({ type: MaciConfig, required: false })
    maciConfig?: MaciConfig;

    @Prop({ required: false })
    maciAddress: string;  // MACI contract address this poll belongs to
}

export const PollsSchema = SchemaFactory.createForClass(Polls);
