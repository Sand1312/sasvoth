import {Prop,Schema,SchemaFactory} from "@nestjs/mongoose";
import {HydratedDocument} from "mongoose";
export type ResultsMetaDocument= HydratedDocument<ResultsMeta>;

@Schema()
export class ResultsMeta{
    @Prop({type:String,required:true})
    pollId:string;
    
    @Prop({type:String,required:false})
    result_cid:string;
    
    @Prop({type:Number,required:true})
    outCome:number;

    @Prop({ required: false, default: Date.now })
    createdAt: Date;

    @Prop({ required: false})
    detailResult:number[];

   
}

export const ResultsMetaSchema= SchemaFactory.createForClass(ResultsMeta);