import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type IdeasDocument = HydratedDocument<Ideas>;

@Schema()
export class Ideas {
    @Prop({ required: false })
    title: string;

    @Prop({ required: false })
    description: string;

    @Prop({required:false})
    descriptionMore: string[];

    @Prop({ required: true ,type:String})
    idea_cid: string;

    @Prop({ required: true ,type:Date})
    createdAt: Date;
    
    @Prop({ required: true ,type:String})
    imgSrc: string;

    @Prop({ required: true ,type:String})
    imgsSrc: string[];

    @Prop({required:true, type:String})
    creatorIdea:String;

}
export const IdeasSchema = SchemaFactory.createForClass(Ideas);