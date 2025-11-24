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
    imgSrc: string;

    @Prop({ required: false ,type:String})
    imgsSrc: string[];

    @Prop({required:true, type:String})
    creatorIdea:String;


    @Prop({ required: false ,type:String})
    idea_cid: string;

    @Prop({ required: true ,type:Date})
    createdAt: Date;
    


}
export const IdeasSchema = SchemaFactory.createForClass(Ideas);