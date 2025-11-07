import {Prop,Schema,SchemaFactory} from "@nestjs/mongoose";
import {HydratedDocument} from "mongoose";

export type VoiceCreditsDocument= HydratedDocument<VoiceCredits>;

@Schema()
export class VoiceCredits{
    @Prop({type:String,required:true})
    userId:string;
  
    @Prop({type:Number,required:true,default:0})
    credits:number;

    @Prop({type:String ,required:true})
    pollId:string;

    @Prop({type:Boolean,required:true,default:true})
    isActive:boolean;
}
export const VoiceCreditsSchema= SchemaFactory.createForClass(VoiceCredits);