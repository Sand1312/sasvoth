import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type IdeasDocument = HydratedDocument<Ideas>;

@Schema()
export class Ideas {
  @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true ,type:String})
    idea_cid: string;

    @Prop({ required: true ,type:Date})
    ceatedAt: Date;
    
    @Prop({ required: true ,type:String})
    imgSrc: string;
}
export const IdeasSchema = SchemaFactory.createForClass(Ideas);