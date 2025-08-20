import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VotingEventDocument = HydratedDocument<VotingEvent>;
@Schema(({ timestamps: true }))
export class VotingEvent {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    startDate: Date;

    @Prop({ required: true })
    endDate: Date;

    @Prop({ required: true, enum: ["upcoming", "ongoing", "finished"], default: "upcoming" })
    status: string;

    @Prop({ required: true })
    ideaCIDs: string[];
}
export const VoiceCreditSchema = SchemaFactory.createForClass(VotingEvent);